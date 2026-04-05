using oracle.DTOs;
using oracle.Models;

namespace oracle.Services.Interfaces;

public interface IMarketplaceService
{
    Task<Result<IReadOnlyList<TokenListing>>> GetActiveListingsAsync(CancellationToken ct = default);
    Task<Result<IReadOnlyList<TokenListing>>> GetByBusinessAsync(string pubkey, CancellationToken ct = default);
}