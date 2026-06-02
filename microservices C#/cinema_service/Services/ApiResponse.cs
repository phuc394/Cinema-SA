using System.Text.Json;

namespace CinemaService.Services;

public static class ApiResponse
{
    public static IResult Success(object data, string? message = null, int statusCode = 200)
    {
        var response = JsonSerializer.Deserialize<Dictionary<string, object?>>(
            JsonSerializer.Serialize(data)) ?? [];
        response["error"] = false;
        if (!string.IsNullOrWhiteSpace(message))
            response["message"] = message;
        return Results.Json(response, statusCode: statusCode);
    }

    public static IResult Error(string message, int statusCode) =>
        Results.Json(new { error = true, message }, statusCode: statusCode);
}

