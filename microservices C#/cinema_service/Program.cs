using CinemaService.Controllers;
using CinemaService.Models;
using CinemaService.Routes;
using CinemaService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? "Server=127.0.0.1;Port=3306;Database=cinema_db;User=auth_user;Password=auth_password;";
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "cinema-sa-dev-secret-csharp-version-keep-long";

builder.Services.AddDbContext<CinemaDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
builder.Services.AddScoped<MovieService>();
builder.Services.AddScoped<MovieController>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => options.TokenValidationParameters = JwtService.TokenValidationParameters(jwtSecret));
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
    db.Database.EnsureCreated();
}

app.MapMovieRoutes();

app.Run();

