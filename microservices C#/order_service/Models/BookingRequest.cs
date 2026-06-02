using System.Text.Json;

namespace OrderService.Models;

public sealed record BookingRequest(
    [property: System.Text.Json.Serialization.JsonPropertyName("showtime_id")] int ShowtimeId,
    [property: System.Text.Json.Serialization.JsonPropertyName("seat_codes")] List<string>? SeatCodes,
    List<JsonElement>? Seats);

