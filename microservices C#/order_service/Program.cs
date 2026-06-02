using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using OrderService.Controllers;
using OrderService.Models;
using OrderService.Routes;
using OrderService.Services;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? "Server=127.0.0.1;Port=3306;Database=order_db;User=auth_user;Password=auth_password;";
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "cinema-sa-dev-secret-csharp-version-keep-long";
var cinemaServiceUrl = (builder.Configuration["CinemaService:Url"] ?? "http://localhost:5101/api").TrimEnd('/');

builder.Services.AddDbContext<OrderDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
builder.Services.AddHttpClient("cinema", client =>
{
    client.BaseAddress = new Uri(cinemaServiceUrl + "/");
    client.Timeout = TimeSpan.FromSeconds(5);
});
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<BookingController>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => options.TokenValidationParameters = JwtService.TokenValidationParameters(jwtSecret));
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    db.Database.EnsureCreated();
}

app.MapBookingRoutes();

app.Run();

