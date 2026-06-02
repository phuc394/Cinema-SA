using OrderService.Controllers;
using OrderService.Models;

namespace OrderService.Routes;

public static class BookingRoutes
{
    public static void MapBookingRoutes(this WebApplication app)
    {
        app.MapGet("/", (BookingController controller) => controller.Index());
        app.MapPost("/bookings", (BookingController controller, BookingRequest request, System.Security.Claims.ClaimsPrincipal principal, HttpRequest httpRequest) => controller.CreateBooking(request, principal, httpRequest)).RequireAuthorization();
        app.MapPost("/bookings/create_booking", (BookingController controller, BookingRequest request, System.Security.Claims.ClaimsPrincipal principal, HttpRequest httpRequest) => controller.CreateBooking(request, principal, httpRequest)).RequireAuthorization();
        app.MapGet("/bookings/history", (BookingController controller, System.Security.Claims.ClaimsPrincipal principal) => controller.GetHistory(principal)).RequireAuthorization();
        app.MapGet("/bookings/showtimes/{showtimeId:int}/reserved-seats", (BookingController controller, int showtimeId) => controller.GetReservedSeats(showtimeId)).RequireAuthorization();
        app.MapGet("/bookings/{bookingId:int}", (BookingController controller, int bookingId, System.Security.Claims.ClaimsPrincipal principal) => controller.GetBookingDetail(bookingId, principal)).RequireAuthorization();
    }
}
