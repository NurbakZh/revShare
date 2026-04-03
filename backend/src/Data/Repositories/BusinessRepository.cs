using Microsoft.EntityFrameworkCore;
using oracle.Data.Repositories.Interfaces;
using oracle.Models;

namespace oracle.Data.Repositories;

public class BusinessRepository(AppDbContext context) : BaseRepository<BusinessProfile>(context), IBusinessRepository
{
    public async Task<BusinessProfile?> GetByPubkeyAsync(string pubkey, CancellationToken ct = default)
        => await DbSet.FirstOrDefaultAsync(x => x.Pubkey == pubkey, ct);

    public async Task<IReadOnlyList<BusinessProfile>> GetAllActiveAsync(CancellationToken ct = default)
        => await DbSet.Where(x => !x.HasDefaulted).ToListAsync(ct);
}