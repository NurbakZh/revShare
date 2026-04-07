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

    public async Task<Result<TokenListing>> RegisterListingAsync(
        RegisterListingDto dto,
        CancellationToken ct = default)
    {
        var existing = await _listingRepository.GetByListingPubkeyAsync(dto.ListingPubkey, ct);
        if (existing is not null)
            return Result<TokenListing>.Ok(existing);

        var listing = TokenListing.Create(
            dto.ListingPubkey,
            dto.BusinessPubkey,
            dto.SellerPubkey,
            dto.Amount,
            dto.PricePerToken);

        await _listingRepository.AddAsync(listing, ct);
        await _listingRepository.SaveChangesAsync(ct);
        return Result<TokenListing>.Ok(listing);
    }

    public async Task<Result<object>> CancelListingAsync(
        string listingPubkey,
        CancellationToken ct = default)
    {
        var listing = await _listingRepository.GetByListingPubkeyAsync(listingPubkey, ct);
        if (listing is null)
            return Result<object>.Fail("Listing not found");
        listing.Cancel();
        await _listingRepository.SaveChangesAsync(ct);
        return Result<object>.Ok(null!);
    }

    public async Task<Result<object>> MarkSoldAsync(
        string listingPubkey,
        CancellationToken ct = default)
    {
        var listing = await _listingRepository.GetByListingPubkeyAsync(listingPubkey, ct);
        if (listing is null)
            return Result<object>.Fail("Listing not found");
        listing.MarkSold();
        await _listingRepository.SaveChangesAsync(ct);
        return Result<object>.Ok(null!);
    }
}