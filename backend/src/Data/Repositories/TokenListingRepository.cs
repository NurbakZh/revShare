using Microsoft.EntityFrameworkCore;
using oracle.Data.Repositories.Interfaces;
using oracle.Models;
using oracle.Models.Enums;

namespace oracle.Data.Repositories;

public class TokenListingRepository(AppDbContext context) : BaseRepository<TokenListing>(context), ITokenListingRepository
{
    public async Task<IReadOnlyList<TokenListing>> GetActiveListingsAsync(CancellationToken ct = default)
        => await DbSet
            .Where(x => x.Status == ListingStatus.Active)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<TokenListing>> GetByBusinessPubkeyAsync(
        string pubkey, CancellationToken ct = default)
        => await DbSet
            .Where(x => x.BusinessPubkey == pubkey)
            .ToListAsync(ct);

    public async Task<TokenListing?> GetByListingPubkeyAsync(
        string pubkey, CancellationToken ct = default)
        => await DbSet.FirstOrDefaultAsync(x => x.ListingPubkey == pubkey, ct);
}