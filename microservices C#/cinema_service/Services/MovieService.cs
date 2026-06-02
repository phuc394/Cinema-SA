using CinemaService.Models;
using Microsoft.EntityFrameworkCore;

namespace CinemaService.Services;

public sealed class MovieService(CinemaDbContext db)
{
    private const int StandardPrice = 75000;
    private const int VipPrice = 90000;

    public Task<List<Movie>> GetMovies() =>
        db.Movies.OrderBy(movie => movie.MovieId).ToListAsync();

    public Task<Movie?> GetMovie(int movieId) =>
        db.Movies.FindAsync(movieId).AsTask();

    public async Task<List<Showtime>> GetShowtimes(int movieId, string? date)
    {
        var query = db.Showtimes.Where(showtime => showtime.MovieId == movieId);
        if (!string.IsNullOrWhiteSpace(date))
        {
            if (!DateOnly.TryParse(date, out var showDate))
                throw new ArgumentException("date must be in YYYY-MM-DD format");
            query = query.Where(showtime => showtime.ShowDate == showDate);
        }

        return await query.OrderBy(item => item.ShowDate).ThenBy(item => item.StartTime).ToListAsync();
    }

    public async Task<object?> GetSeatMap(int showtimeId, int userId)
    {
        var showtime = await db.Showtimes.FindAsync(showtimeId);
        if (showtime is null)
            return null;

        var room = await db.Rooms.FindAsync(showtime.RoomId);
        var now = DateTime.UtcNow;
        await ClearExpiredLocks(showtimeId, now);

        var locks = await db.TemporarySeatLocks
            .Where(lockItem => lockItem.ShowtimeId == showtimeId && lockItem.Status == 1 && lockItem.ExpiresAt > now)
            .ToDictionaryAsync(lockItem => lockItem.SeatCode);
        var seats = await db.Seats
            .Where(seat => seat.RoomId == showtime.RoomId)
            .OrderBy(seat => seat.RowIndex)
            .ThenBy(seat => seat.ColIndex)
            .ToListAsync();

        return new
        {
            showtime_id = showtime.ShowtimeId,
            movie_id = showtime.MovieId,
            room = room?.RoomName,
            show_date = showtime.ShowDate.ToString("yyyy-MM-dd"),
            start_time = showtime.StartTime.ToString("HH:mm:ss"),
            end_time = showtime.EndTime.ToString("HH:mm:ss"),
            seats = seats.Select(seat =>
            {
                var code = $"{seat.RowIndex}{seat.ColIndex}";
                locks.TryGetValue(code, out var lockItem);
                var seatType = string.CompareOrdinal(seat.RowIndex, "H") >= 0 ? "VIP" : "STANDARD";
                return new
                {
                    seat_id = seat.SeatId,
                    code,
                    row = seat.RowIndex,
                    column = seat.ColIndex,
                    type = seatType,
                    price = seatType == "VIP" ? VipPrice : StandardPrice,
                    is_available = lockItem is null,
                    is_locked = lockItem is not null,
                    locked_by_current_user = lockItem is not null && lockItem.UserId == userId,
                    lock_expires_at = lockItem?.ExpiresAt.ToString("O")
                };
            })
        };
    }

    public async Task LockSeats(int showtimeId, IReadOnlyCollection<string> seatCodes, int userId)
    {
        var showtime = await db.Showtimes.FindAsync(showtimeId);
        if (showtime is null)
            throw new KeyNotFoundException("Showtime not found");

        var now = DateTime.UtcNow;
        await ClearExpiredLocks(showtimeId, now);

        var activeLocks = await db.TemporarySeatLocks
            .Where(lockItem => lockItem.ShowtimeId == showtimeId && seatCodes.Contains(lockItem.SeatCode) && lockItem.Status == 1 && lockItem.ExpiresAt > now)
            .ToListAsync();
        var blockedSeat = activeLocks.FirstOrDefault(lockItem => lockItem.UserId != userId);
        if (blockedSeat is not null)
            throw new ArgumentException($"Seat {blockedSeat.SeatCode} is locked by another user");

        await db.TemporarySeatLocks
            .Where(lockItem => lockItem.ShowtimeId == showtimeId && seatCodes.Contains(lockItem.SeatCode) && lockItem.UserId == userId && lockItem.Status == 1)
            .ExecuteDeleteAsync();

        var expiresAt = now.AddMinutes(5);
        foreach (var code in seatCodes)
        {
            db.TemporarySeatLocks.Add(new TemporarySeatLock
            {
                ShowtimeId = showtimeId,
                SeatCode = code,
                UserId = userId,
                LockedAt = now,
                ExpiresAt = expiresAt,
                Status = 1
            });
        }

        await db.SaveChangesAsync();
    }

    public Task ReleaseSeats(int showtimeId, IReadOnlyCollection<string> seatCodes, int userId) =>
        db.TemporarySeatLocks
            .Where(lockItem => lockItem.ShowtimeId == showtimeId && seatCodes.Contains(lockItem.SeatCode) && lockItem.UserId == userId && lockItem.Status == 1)
            .ExecuteDeleteAsync();

    private Task ClearExpiredLocks(int showtimeId, DateTime now) =>
        db.TemporarySeatLocks
            .Where(lockItem => lockItem.ShowtimeId == showtimeId && lockItem.ExpiresAt <= now && lockItem.Status == 1)
            .ExecuteDeleteAsync();

    public static string MovieStatus(int status) => status switch
    {
        1 => "now_showing",
        0 => "coming_soon",
        -1 => "stopped",
        _ => "unknown"
    };
}

