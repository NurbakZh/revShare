namespace oracle.DTOs;

public record RegisterBusinessDto(
    string Pubkey,
    string OwnerPubkey,
    string Name,
    string Description,
    string City,
    ulong RaiseLimit,
    ulong TargetRevenue,
    string? LogoUrl = null
);