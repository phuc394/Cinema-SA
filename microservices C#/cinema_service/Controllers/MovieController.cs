using System.Security.Claims;
using CinemaService.Models;
using CinemaService.Services;

namespace CinemaService.Controllers;

public sealed class MovieController(MovieService service)
{
    public IResult Index() => Results.Ok(new { message = "Cinema service is running" });

    public async Task<IResult> ListMovies()
    {
        var movies = await service.GetMovies();
        return Results.Ok(movies.Select(movie => new
        {
            id = movie.MovieId,
            title = movie.Title,
            genre = movie.Genre,
            poster_url = movie.PosterUrl,
            duration = movie.Duration,
            release_date = movie.ReleaseDate?.ToString("yyyy-MM-dd"),
            status = MovieService.MovieStatus(movie.Status)
        }));
    }

    public async Task<IResult> MovieDetails(int movieId)
    {
        var movie = await service.GetMovie(movieId);
        return movie is null
            ? ApiResponse.Error("Movie not found", 404)
            : ApiResponse.Success(new
            {
                movie = new
                {
                    id = movie.MovieId,
                    title = movie.Title,
                    genre = movie.Genre,
                    description = movie.Description,
                    poster_url = movie.PosterUrl,
                    duration = movie.Duration,
                    release_date = movie.ReleaseDate?.ToString("yyyy-MM-dd"),
                    status = MovieService.MovieStatus(movie.Status)
                }
            });
    }

    public async Task<IResult> ListShowtimes(int movieId, string? date)
    {
        try
        {
            var showtimes = await service.GetShowtimes(movieId, date);
            return ApiResponse.Success(new
            {
                showtimes = showtimes.Select(showtime => new
                {
                    showtime_id = showtime.ShowtimeId,
                    movie_id = showtime.MovieId,
                    room_id = showtime.RoomId,
                    show_date = showtime.ShowDate.ToString("yyyy-MM-dd"),
                    start_time = showtime.StartTime.ToString("HH:mm:ss"),
                    end_time = showtime.EndTime.ToString("HH:mm:ss")
                })
            });
        }
        catch (ArgumentException exc)
        {
            return ApiResponse.Error(exc.Message, 400);
        }
    }

    public async Task<IResult> GetSeatMap(int showtimeId, ClaimsPrincipal principal)
    {
        var seatMap = await service.GetSeatMap(showtimeId, JwtService.UserId(principal));
        return seatMap is null ? ApiResponse.Error("Showtime not found", 404) : ApiResponse.Success(seatMap);
    }

    public async Task<IResult> LockSeats(int showtimeId, SeatCodesRequest request, ClaimsPrincipal principal)
    {
        var seatCodes = NormalizeSeatCodes(request);
        if (seatCodes.Count == 0)
            return ApiResponse.Error("seat_codes are required", 400);

        try
        {
            await service.LockSeats(showtimeId, seatCodes, JwtService.UserId(principal));
            return ApiResponse.Success(new { message = "Seats locked successfully" });
        }
        catch (KeyNotFoundException exc)
        {
            return ApiResponse.Error(exc.Message, 404);
        }
        catch (ArgumentException exc)
        {
            return ApiResponse.Error(exc.Message, 400);
        }
    }

    public async Task<IResult> ReleaseSeats(int showtimeId, SeatCodesRequest request, ClaimsPrincipal principal)
    {
        var seatCodes = NormalizeSeatCodes(request);
        if (seatCodes.Count == 0)
            return ApiResponse.Error("seat_codes are required", 400);

        await service.ReleaseSeats(showtimeId, seatCodes, JwtService.UserId(principal));
        return ApiResponse.Success(new { message = "Seats released successfully" });
    }

    private static List<string> NormalizeSeatCodes(SeatCodesRequest request) =>
        request.SeatCodes?
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code.Trim().ToUpperInvariant())
            .Distinct()
            .ToList() ?? [];
}

