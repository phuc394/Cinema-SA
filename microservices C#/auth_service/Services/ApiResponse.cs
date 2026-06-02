using AuthService.Models;
using System.Text.Json;

namespace AuthService.Services;

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

    public static object UserDto(User user, bool includeCreatedAt = false, bool includeUpdatedAt = false)
    {
        var dto = new Dictionary<string, object?>
        {
            ["user_id"] = user.UserId,
            ["full_name"] = user.FullName,
            ["phone_number"] = user.PhoneNumber,
            ["email"] = user.Email
        };
        if (includeCreatedAt) dto["created_at"] = user.CreatedAt.ToString("O");
        if (includeUpdatedAt) dto["updated_at"] = user.UpdatedAt.ToString("O");
        return dto;
    }
}

