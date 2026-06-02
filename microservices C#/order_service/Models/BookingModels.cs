using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrderService.Models;

public sealed class Booking
{
    [Key, Column("booking_id")] public int BookingId { get; set; }
    [Column("user_id")] public int UserId { get; set; }
    [Column("showtime_id")] public int ShowtimeId { get; set; }
    [Column("total_amount")] public decimal TotalAmount { get; set; }
    [Column("status")] public int Status { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

public sealed class BookingDetail
{
    [Key, Column("detail_id")] public int DetailId { get; set; }
    [Column("booking_id")] public int BookingId { get; set; }
    [Column("seat_code")] public string SeatCode { get; set; } = "";
    [Column("seat_price")] public decimal SeatPrice { get; set; }
}

