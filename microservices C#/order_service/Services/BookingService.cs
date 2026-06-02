using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OrderService.Models;

namespace OrderService.Services;

public sealed class BookingService(OrderDbContext db, IHttpClientFactory httpClientFactory)
{
    public async Task<Booking> CreateBooking(int userId, BookingRequest request, string accessToken)
    {
        var showtimeId = request.ShowtimeId;
        var seatCodes = ExtractSeatCodes(request).Distinct().ToList();
        if (showtimeId <= 0 || seatCodes.Count == 0)
            throw new BookingException("showtime_id and seat_codes are required");

        var cinema = CreateCinemaClient(accessToken);
        var lockResponse = await cinema.PostAsJsonAsync($"showtimes/{showtimeId}/seats/lock", new { seat_codes = seatCodes });
        if (!lockResponse.IsSuccessStatusCode)
            throw new BookingException($"Unable to lock seats: {await UpstreamMessage(lockResponse)}");

        try
        {
            var availableSeats = await FetchAvailableSeats(cinema, showtimeId);
            var invalidSeats = seatCodes.Where(code => !availableSeats.ContainsKey(code)).ToList();
            if (invalidSeats.Count > 0)
                throw new BookingException($"Invalid seat codes: {string.Join(", ", invalidSeats)}");

            var alreadyBooked = await GetReservedSeats(showtimeId, seatCodes);
            if (alreadyBooked.Count > 0)
                throw new BookingException($"Seats already booked: {string.Join(", ", alreadyBooked.OrderBy(code => code))}");

            var booking = new Booking
            {
                UserId = userId,
                ShowtimeId = showtimeId,
                TotalAmount = seatCodes.Sum(code => availableSeats[code]),
                Status = 1,
                CreatedAt = DateTime.UtcNow
            };
            db.Bookings.Add(booking);
            await db.SaveChangesAsync();

            foreach (var code in seatCodes)
            {
                db.BookingDetails.Add(new BookingDetail
                {
                    BookingId = booking.BookingId,
                    SeatCode = code,
                    SeatPrice = availableSeats[code]
                });
            }

            await db.SaveChangesAsync();
            return booking;
        }
        finally
        {
            await cinema.PostAsJsonAsync($"showtimes/{showtimeId}/seats/release", new { seat_codes = seatCodes });
        }
    }

    public Task<List<Booking>> GetHistory(int userId) =>
        db.Bookings
            .Where(booking => booking.UserId == userId)
            .OrderByDescending(booking => booking.BookingId)
            .ToListAsync();

    public Task<List<string>> GetReservedSeats(int showtimeId) =>
        db.BookingDetails
            .Join(db.Bookings, detail => detail.BookingId, booking => booking.BookingId, (detail, booking) => new { detail, booking })
            .Where(row => row.booking.ShowtimeId == showtimeId && row.booking.Status >= 0)
            .Select(row => row.detail.SeatCode)
            .Distinct()
            .OrderBy(code => code)
            .ToListAsync();

    public async Task<(Booking? Booking, List<BookingDetail> Details)> GetBookingDetail(int bookingId, int userId)
    {
        var booking = await db.Bookings.FirstOrDefaultAsync(item => item.BookingId == bookingId && item.UserId == userId);
        if (booking is null)
            return (null, []);

        var details = await db.BookingDetails.Where(detail => detail.BookingId == bookingId).ToListAsync();
        return (booking, details);
    }

    private HttpClient CreateCinemaClient(string accessToken)
    {
        var cinema = httpClientFactory.CreateClient("cinema");
        cinema.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return cinema;
    }

    private async Task<Dictionary<string, decimal>> FetchAvailableSeats(HttpClient cinema, int showtimeId)
    {
        var seatMapResponse = await cinema.GetAsync($"showtimes/{showtimeId}/seats");
        if (seatMapResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
            throw new BookingException("Showtime not found");
        if (!seatMapResponse.IsSuccessStatusCode)
            throw new BookingException("Unable to verify seats from cinema service");

        var seatMapJson = await seatMapResponse.Content.ReadFromJsonAsync<JsonElement>();
        var seatsRoot = seatMapJson.TryGetProperty("seats", out var directSeats)
            ? directSeats
            : seatMapJson.GetProperty("data").GetProperty("seats");
        return seatsRoot.EnumerateArray()
            .ToDictionary(item => item.GetProperty("code").GetString() ?? "", item => item.GetProperty("price").GetDecimal());
    }

    private Task<List<string>> GetReservedSeats(int showtimeId, IReadOnlyCollection<string> seatCodes) =>
        db.BookingDetails
            .Join(db.Bookings, detail => detail.BookingId, booking => booking.BookingId, (detail, booking) => new { detail, booking })
            .Where(row => row.booking.ShowtimeId == showtimeId && row.booking.Status >= 0 && seatCodes.Contains(row.detail.SeatCode))
            .Select(row => row.detail.SeatCode)
            .ToListAsync();

    private static List<string> ExtractSeatCodes(BookingRequest request)
    {
        if (request.SeatCodes is { Count: > 0 })
            return request.SeatCodes.Where(code => !string.IsNullOrWhiteSpace(code)).Select(code => code.Trim().ToUpperInvariant()).ToList();
        if (request.Seats is null)
            return [];

        var result = new List<string>();
        foreach (var seat in request.Seats)
        {
            if (seat.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(seat.GetString()))
                result.Add(seat.GetString()!.Trim().ToUpperInvariant());
            if (seat.ValueKind == JsonValueKind.Object && seat.TryGetProperty("seat_code", out var seatCode) && !string.IsNullOrWhiteSpace(seatCode.GetString()))
                result.Add(seatCode.GetString()!.Trim().ToUpperInvariant());
        }
        return result;
    }

    private static async Task<string> UpstreamMessage(HttpResponseMessage response)
    {
        try
        {
            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            return json.TryGetProperty("message", out var message) ? message.GetString() ?? "Unable to lock seats" : "Unable to lock seats";
        }
        catch
        {
            return "Unable to lock seats";
        }
    }
}

