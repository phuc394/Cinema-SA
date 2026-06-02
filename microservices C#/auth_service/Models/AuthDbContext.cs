using Microsoft.EntityFrameworkCore;

namespace AuthService.Models;

public sealed class AuthDbContext(DbContextOptions<AuthDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var user = modelBuilder.Entity<User>();
        user.ToTable("User");
        user.HasKey(item => item.UserId);
        user.HasIndex(item => item.PhoneNumber).IsUnique();
        user.HasIndex(item => item.Email).IsUnique();
    }
}

