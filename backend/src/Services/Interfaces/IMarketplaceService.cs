using oracle.DTOs;
using oracle.Models;

namespace oracle.Services.Interfaces;

public interface IMarketplaceService
{
    Task<Result<IReadOnlyList<TokenListing>>> GetActiveListingsAsync(CancellationToken ct = default);
    Task<Result<IReadOnlyList<TokenListing>>> GetByBusinessAsync(string pubkey, CancellationToken ct = default);
    Task<Result<TokenListing>> RegisterListingAsync(RegisterListingDto dto, CancellationToken ct = default);
    Task<Result<object>> CancelListingAsync(string listingPubkey, CancellationToken ct = default);
    Task<Result<object>> MarkSoldAsync(string listingPubkey, CancellationToken ct = default);
}