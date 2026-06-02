namespace CinemaService.Models;

public sealed record SeatCodesRequest(
    [property: System.Text.Json.Serialization.JsonPropertyName("seat_codes")] List<string>? SeatCodes);

