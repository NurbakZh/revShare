using oracle.Models;

namespace oracle.Data.Repositories.Interfaces;

public interface ITokenListingRepository : IRepository<TokenListing>
{
    Task<IReadOnlyList<TokenListing>> GetActiveListingsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<TokenListing>> GetByBusinessPubkeyAsync(string pubkey, CancellationToken ct = default);
    Task<TokenListing?> GetByListingPubkeyAsync(string pubkey, CancellationToken ct = default);
}