using CinemaService.Controllers;
using CinemaService.Models;

namespace CinemaService.Routes;

public static class MovieRoutes
{
    public static void MapMovieRoutes(this WebApplication app)
    {
        app.MapGet("/", (MovieController controller) => controller.Index());
        app.MapGet("/api/movies", (MovieController controller) => controller.ListMovies());
        app.MapGet("/api/movies/{movieId:int}", (MovieController controller, int movieId) => controller.MovieDetails(movieId));
        app.MapGet("/api/movies/{movieId:int}/showtimes", (MovieController controller, int movieId, string? date) => controller.ListShowtimes(movieId, date));
        app.MapGet("/api/showtimes/{showtimeId:int}/seats", (MovieController controller, int showtimeId, System.Security.Claims.ClaimsPrincipal principal) => controller.GetSeatMap(showtimeId, principal)).RequireAuthorization();
        app.MapPost("/api/showtimes/{showtimeId:int}/seats/lock", (MovieController controller, int showtimeId, SeatCodesRequest request, System.Security.Claims.ClaimsPrincipal principal) => controller.LockSeats(showtimeId, request, principal)).RequireAuthorization();
        app.MapPost("/api/showtimes/{showtimeId:int}/seats/release", (MovieController controller, int showtimeId, SeatCodesRequest request, System.Security.Claims.ClaimsPrincipal principal) => controller.ReleaseSeats(showtimeId, request, principal)).RequireAuthorization();
    }
}
