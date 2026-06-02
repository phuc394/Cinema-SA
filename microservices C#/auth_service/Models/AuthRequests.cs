namespace AuthService.Models;

public sealed record RegisterRequest(
    [property: System.Text.Json.Serialization.JsonPropertyName("full_name")] string? FullName,
    [property: System.Text.Json.Serialization.JsonPropertyName("phone_number")] string? PhoneNumber,
    string? Email,
    string? Password);

public sealed record LoginRequest(
    string? Email,
    [property: System.Text.Json.Serialization.JsonPropertyName("phone_number")] string? PhoneNumber,
    string? Password);

public sealed record ProfileRequest(
    [property: System.Text.Json.Serialization.JsonPropertyName("full_name")] string? FullName,
    [property: System.Text.Json.Serialization.JsonPropertyName("phone_number")] string? PhoneNumber,
    string? Email);

public sealed record PasswordRequest(
    [property: System.Text.Json.Serialization.JsonPropertyName("current_password")] string? CurrentPassword,
    [property: System.Text.Json.Serialization.JsonPropertyName("new_password")] string? NewPassword);

