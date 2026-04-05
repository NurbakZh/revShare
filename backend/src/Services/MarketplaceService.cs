using oracle.Data.Repositories.Interfaces;
using oracle.DTOs;
using oracle.Models;
using oracle.Services.Interfaces;

namespace oracle.Services;

public class MarketplaceService(ITokenListingRepository listingRepository) : IMarketplaceService
{
    private readonly ITokenListingRepository _listingRepository = listingRepository;

    public async Task<Result<IReadOnlyList<TokenListing>>> GetActiveListingsAsync(
        CancellationToken ct = default)
    {
        var listings = await _listingRepository.GetActiveListingsAsync(ct);
        return Result<IReadOnlyList<TokenListing>>.Ok(listings);
    }

    public async Task<Result<IReadOnlyList<TokenListing>>> GetByBusinessAsync(
        string pubkey,
        CancellationToken ct = default)
    {
        var listings = await _listingRepository.GetByBusinessPubkeyAsync(pubkey, ct);
        return Result<IReadOnlyList<TokenListing>>.Ok(listings);
    }
}