using oracle.Models.Common;
using oracle.Models.Enums;
using oracle.Models.Events;

namespace oracle.Models;

public class BusinessProfile : BaseAggregateRoot
{
    public string Pubkey { get; private set; } = string.Empty;
    public string OwnerPubkey { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string? LogoUrl { get; private set; }
    public BusinessRank Rank { get; private set; } = BusinessRank.Newcomer;
    public ulong RaiseLimit { get; private set; }
    public ulong TargetRevenue { get; private set; }
    public int ConsecutivePayments { get; private set; }
    public bool HasDefaulted { get; private set; }

    private BusinessProfile() { }

    public static BusinessProfile Create(
        string pubkey,
        string ownerPubkey,
        string name,
        string description,
        string city,
        ulong raiseLimit,
        ulong targetRevenue,
        string? logoUrl = null)
    {
        return new BusinessProfile
        {
            Pubkey = pubkey,
            OwnerPubkey = ownerPubkey,
            Name = name,
            Description = description,
            City = city,
            RaiseLimit = raiseLimit,
            TargetRevenue = targetRevenue,
            LogoUrl = logoUrl,
        };
    }

    public void RecordSuccessfulPayment()
    {
        ConsecutivePayments++;
        SetUpdatedAt();
    }

    public void RecordDefault()
    {
        HasDefaulted = true;
        ConsecutivePayments = 0;
        SetUpdatedAt();
    }

    public void UpgradeRank(BusinessRank newRank)
    {
        if (newRank <= Rank) return;

        var oldRank = Rank;
        Rank = newRank;
        SetUpdatedAt();

        AddDomainEvent(new BusinessRankUpgradedEvent(
            Pubkey, oldRank, newRank, DateTime.UtcNow));
    }
}