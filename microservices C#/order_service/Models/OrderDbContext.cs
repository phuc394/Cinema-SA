using Microsoft.EntityFrameworkCore;

namespace OrderService.Models;

public sealed class OrderDbContext(DbContextOptions<OrderDbContext> options) : DbContext(options)
{
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingDetail> BookingDetails => Set<BookingDetail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>().ToTable("Booking").HasKey(item => item.BookingId);
        modelBuilder.Entity<BookingDetail>().ToTable("BookingDetail").HasKey(item => item.DetailId);
    }
}

