using System.Security.Claims;
using AuthService.Models;
using AuthService.Services;

namespace AuthService;

public sealed class AuthController(AuthBusinessService service)
{
    public IResult Index() => Results.Ok(new { message = "Auth service is running" });

    public async Task<IResult> Register(RegisterRequest request)
    {
        try
        {
            var user = await service.Register(request);
            return ApiResponse.Success(new { user = ApiResponse.UserDto(user, includeCreatedAt: true) }, "User registered successfully", 201);
        }
        catch (ArgumentException exc)
        {
            return ApiResponse.Error(exc.Message, 400);
        }
    }

    public async Task<IResult> Login(LoginRequest request)
    {
        try
        {
            var (user, role, token) = await service.Login(request);
            return ApiResponse.Success(new { token, role, user = ApiResponse.UserDto(user) }, "Login successful");
        }
        catch (ArgumentException exc)
        {
            return ApiResponse.Error(exc.Message, 400);
        }
        catch (UnauthorizedAccessException exc)
        {
            return ApiResponse.Error(exc.Message, 401);
        }
    }

    public IResult Logout() => Results.Ok(new { message = "Logged out successfully" });

    public async Task<IResult> GetProfile(ClaimsPrincipal principal)
    {
        var user = await service.GetProfile(JwtService.UserId(principal));
        return user is null
            ? Results.NotFound(new { message = "User not found" })
            : Results.Ok(ApiResponse.UserDto(user, includeCreatedAt: true, includeUpdatedAt: true));
    }

    public async Task<IResult> UpdateProfile(ProfileRequest request, ClaimsPrincipal principal)
    {
        try
        {
            var user = await service.UpdateProfile(JwtService.UserId(principal), request);
            return user is null
                ? Results.NotFound(new { message = "User not found" })
                : Results.Ok(new { message = "Profile updated successfully", user = ApiResponse.UserDto(user, includeUpdatedAt: true) });
        }
        catch (ArgumentException exc)
        {
            return Results.BadRequest(new { message = exc.Message });
        }
    }

    public async Task<IResult> ChangePassword(PasswordRequest request, ClaimsPrincipal principal)
    {
        try
        {
            var changed = await service.ChangePassword(JwtService.UserId(principal), request);
            return changed
                ? Results.Ok(new { message = "Password changed successfully" })
                : Results.NotFound(new { message = "User not found" });
        }
        catch (ArgumentException exc)
        {
            return Results.BadRequest(new { message = exc.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
    }
}

