namespace oracle.DTOs;

public record RegisterListingDto(
    string ListingPubkey,
    string BusinessPubkey,
    string SellerPubkey,
    ulong Amount,
    ulong PricePerToken
);
