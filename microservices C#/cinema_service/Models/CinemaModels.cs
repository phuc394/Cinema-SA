using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CinemaService.Models;

public sealed class Movie
{
    [Key, Column("movie_id")] public int MovieId { get; set; }
    [Column("title")] public string Title { get; set; } = "";
    [Column("poster_url")] public string? PosterUrl { get; set; }
    [Column("genre")] public string? Genre { get; set; }
    [Column("description")] public string? Description { get; set; }
    [Column("duration")] public int Duration { get; set; }
    [Column("release_date")] public DateOnly? ReleaseDate { get; set; }
    [Column("status")] public int Status { get; set; }
}

public sealed class Room
{
    [Key, Column("room_id")] public int RoomId { get; set; }
    [Column("room_name")] public string RoomName { get; set; } = "";
}

public sealed class Seat
{
    [Key, Column("seat_id")] public int SeatId { get; set; }
    [Column("room_id")] public int RoomId { get; set; }
    [Column("row_index")] public string RowIndex { get; set; } = "";
    [Column("col_index")] public int ColIndex { get; set; }
}

public sealed class Showtime
{
    [Key, Column("showtime_id")] public int ShowtimeId { get; set; }
    [Column("movie_id")] public int MovieId { get; set; }
    [Column("show_date")] public DateOnly ShowDate { get; set; }
    [Column("start_time")] public TimeOnly StartTime { get; set; }
    [Column("end_time")] public TimeOnly EndTime { get; set; }
    [Column("room_id")] public int RoomId { get; set; }
}

public sealed class TemporarySeatLock
{
    [Key, Column("lock_id")] public int LockId { get; set; }
    [Column("showtime_id")] public int ShowtimeId { get; set; }
    [Column("seat_code")] public string SeatCode { get; set; } = "";
    [Column("user_id")] public int UserId { get; set; }
    [Column("locked_at")] public DateTime LockedAt { get; set; }
    [Column("expires_at")] public DateTime ExpiresAt { get; set; }
    [Column("status")] public int Status { get; set; }
}

