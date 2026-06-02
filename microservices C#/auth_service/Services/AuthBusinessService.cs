using System.Text.RegularExpressions;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Services;

public sealed class AuthBusinessService(AuthDbContext db, IConfiguration configuration)
{
    public async Task<User> Register(RegisterRequest request)
    {
        var fullName = (request.FullName ?? "").Trim();
        var phone = (request.PhoneNumber ?? "").Trim();
        var email = (request.Email ?? "").Trim().ToLowerInvariant();
        var password = request.Password ?? "";

        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Missing required fields: full_name, phone_number, email, password");
        if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            throw new ArgumentException("Invalid email format");
        if (password.Length < 6)
            throw new ArgumentException("Password must be at least 6 characters");
        if (!Regex.IsMatch(phone, @"^[0-9+\-\s]{8,20}$"))
            throw new ArgumentException("Invalid phone number");
        if (await db.Users.AnyAsync(user => user.PhoneNumber == phone))
            throw new ArgumentException("Phone number already exists");
        if (await db.Users.AnyAsync(user => user.Email == email))
            throw new ArgumentException("Email already exists");

        var now = DateTime.UtcNow;
        var user = new User
        {
            FullName = fullName,
            PhoneNumber = phone,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    public async Task<(User User, string Role, string Token)> Login(LoginRequest request)
    {
        var identifier = (request.Email ?? request.PhoneNumber ?? "").Trim().ToLowerInvariant();
        var password = request.Password ?? "";
        if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("email/phone_number and password are required");

        var user = await db.Users.FirstOrDefaultAsync(item => item.Email == identifier || item.PhoneNumber == identifier);
        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials");

        var role = "USER";
        var secret = configuration["Jwt:Secret"] ?? "cinema-sa-dev-secret-csharp-version-keep-long";
        var expiresInHours = int.TryParse(configuration["Jwt:ExpiresInHours"], out var hours) ? hours : 24;
        return (user, role, JwtService.CreateToken(user.UserId, role, secret, expiresInHours));
    }

    public Task<User?> GetProfile(int userId) => db.Users.FindAsync(userId).AsTask();

    public async Task<User?> UpdateProfile(int userId, ProfileRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            return null;

        var fullName = (request.FullName ?? "").Trim();
        var phone = (request.PhoneNumber ?? "").Trim();
        var email = (request.Email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("full_name, phone_number and email are required");
        if (await db.Users.AnyAsync(item => item.PhoneNumber == phone && item.UserId != userId))
            throw new ArgumentException("Phone number already exists");
        if (await db.Users.AnyAsync(item => item.Email == email && item.UserId != userId))
            throw new ArgumentException("Email already exists");

        user.FullName = fullName;
        user.PhoneNumber = phone;
        user.Email = email;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return user;
    }

    public async Task<bool> ChangePassword(int userId, PasswordRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            return false;
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            throw new ArgumentException("current_password and new_password are required");
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }
}

