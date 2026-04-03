using Microsoft.EntityFrameworkCore;
using oracle.Models;

namespace oracle.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<BusinessProfile> Businesses => Set<BusinessProfile>();
    public DbSet<RevenueRecord> RevenueRecords => Set<RevenueRecord>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<TokenListing> TokenListings => Set<TokenListing>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}