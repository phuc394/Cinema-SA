using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OrderService.Models;
using OrderService.Services;

namespace OrderService.Controllers;

public sealed class BookingController(BookingService service)
{
    public IResult Index() => Results.Ok("Order service is running");

    public async Task<IResult> CreateBooking(BookingRequest request, ClaimsPrincipal principal, HttpRequest httpRequest)
    {
        try
        {
            var token = httpRequest.Headers.Authorization.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase).Trim();
            var booking = await service.CreateBooking(JwtService.UserId(principal), request, token);
            return ApiResponse.Success(new
            {
                booking = new
                {
                    booking_id = booking.BookingId,
                    status = booking.Status,
                    user_id = booking.UserId,
                    showtime_id = booking.ShowtimeId,
                    total_amount = booking.TotalAmount
                }
            }, "Booking created successfully", 201);
        }
        catch (BookingException exc)
        {
            return ApiResponse.Error(exc.Message, exc.StatusCode);
        }
    }

    public async Task<IResult> GetHistory(ClaimsPrincipal principal)
    {
        var bookings = await service.GetHistory(JwtService.UserId(principal));
        return Results.Ok(bookings.Select(booking => new
        {
            booking_id = booking.BookingId,
            showtime_id = booking.ShowtimeId,
            total_amount = booking.TotalAmount,
            status = booking.Status,
            created_at = booking.CreatedAt.ToString("O")
        }));
    }

    public async Task<IResult> GetReservedSeats(int showtimeId)
    {
        var seatCodes = await service.GetReservedSeats(showtimeId);
        return ApiResponse.Success(new { showtime_id = showtimeId, seat_codes = seatCodes });
    }

    public async Task<IResult> GetBookingDetail(int bookingId, ClaimsPrincipal principal)
    {
        var (booking, details) = await service.GetBookingDetail(bookingId, JwtService.UserId(principal));
        if (booking is null)
            return ApiResponse.Error("Booking not found", 404);

        return ApiResponse.Success(new
        {
            booking = new
            {
                booking_id = booking.BookingId,
                showtime_id = booking.ShowtimeId,
                total_amount = booking.TotalAmount,
                status = booking.Status,
                seats = details.Select(detail => new { seat_code = detail.SeatCode, price = detail.SeatPrice })
            }
        });
    }
}

