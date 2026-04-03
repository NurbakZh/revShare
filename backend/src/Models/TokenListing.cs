using oracle.Models.Common;
using oracle.Models.Enums;

namespace oracle.Models;

public class TokenListing : BaseAuditableEntity
{
    public string ListingPubkey { get; private set; } = string.Empty;
    public string BusinessPubkey { get; private set; } = string.Empty;
    public string SellerPubkey { get; private set; } = string.Empty;
    public ulong Amount { get; private set; }
    public ulong PricePerToken { get; private set; }
    public ListingStatus Status { get; private set; } = ListingStatus.Active;

    private TokenListing() { }

    public static TokenListing Create(
        string listingPubkey,
        string businessPubkey,
        string sellerPubkey,
        ulong amount,
        ulong pricePerToken)
    {
        return new TokenListing
        {
            ListingPubkey = listingPubkey,
            BusinessPubkey = businessPubkey,
            SellerPubkey = sellerPubkey,
            Amount = amount,
            PricePerToken = pricePerToken,
        };
    }

    public void MarkSold()
    {
        Status = ListingStatus.Sold;
        SetUpdatedAt();
    }

    public void Cancel()
    {
        Status = ListingStatus.Cancelled;
        SetUpdatedAt();
    }
}