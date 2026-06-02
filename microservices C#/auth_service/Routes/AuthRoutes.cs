namespace AuthService.Routes;

public static class AuthRoutes
{
    public static void MapAuthRoutes(this WebApplication app)
    {
        app.MapGet("/", (AuthController controller) => controller.Index());
        app.MapPost("/api/auth/register", (AuthController controller, Models.RegisterRequest request) => controller.Register(request));
        app.MapPost("/api/auth/login", (AuthController controller, Models.LoginRequest request) => controller.Login(request));
        app.MapPost("/api/auth/logout", (AuthController controller) => controller.Logout()).RequireAuthorization();
        app.MapGet("/api/auth/profile", (AuthController controller, System.Security.Claims.ClaimsPrincipal principal) => controller.GetProfile(principal)).RequireAuthorization();
        app.MapPut("/api/auth/profile", (AuthController controller, Models.ProfileRequest request, System.Security.Claims.ClaimsPrincipal principal) => controller.UpdateProfile(request, principal)).RequireAuthorization();
        app.MapPatch("/api/auth/profile/password", (AuthController controller, Models.PasswordRequest request, System.Security.Claims.ClaimsPrincipal principal) => controller.ChangePassword(request, principal)).RequireAuthorization();
    }
}
