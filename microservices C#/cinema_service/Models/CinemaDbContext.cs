using Microsoft.EntityFrameworkCore;

namespace CinemaService.Models;

public sealed class CinemaDbContext(DbContextOptions<CinemaDbContext> options) : DbContext(options)
{
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<Showtime> Showtimes => Set<Showtime>();
    public DbSet<TemporarySeatLock> TemporarySeatLocks => Set<TemporarySeatLock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Movie>().ToTable("Movie").HasKey(item => item.MovieId);
        modelBuilder.Entity<Room>().ToTable("Room").HasKey(item => item.RoomId);
        modelBuilder.Entity<Seat>().ToTable("Seat").HasKey(item => item.SeatId);
        modelBuilder.Entity<Showtime>().ToTable("Showtime").HasKey(item => item.ShowtimeId);
        modelBuilder.Entity<TemporarySeatLock>().ToTable("TemporarySeatLock").HasKey(item => item.LockId);
    }
}

