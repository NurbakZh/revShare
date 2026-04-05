using Microsoft.EntityFrameworkCore;
using oracle.Data.Repositories.Interfaces;
using oracle.Models;

namespace oracle.Data.Repositories;

public class RevenueRepository(AppDbContext context) : BaseRepository<RevenueRecord>(context), IRevenueRepository
{
    public async Task<IReadOnlyList<RevenueRecord>> GetByBusinessPubkeyAsync(
        string pubkey, CancellationToken ct = default)
        => await DbSet
            .Where(x => x.BusinessPubkey == pubkey)
            .OrderBy(x => x.Epoch)
            .ToListAsync(ct);

    public async Task<RevenueRecord?> GetLatestByBusinessAsync(
        string pubkey, CancellationToken ct = default)
        => await DbSet
            .Where(x => x.BusinessPubkey == pubkey)
            .OrderByDescending(x => x.Epoch)
            .FirstOrDefaultAsync(ct);
}