using oracle.Models.Common;
using oracle.Models.Enums;

namespace oracle.Models.Events;

public record BusinessRankUpgradedEvent(
    string BusinessPubkey,
    BusinessRank OldRank,
    BusinessRank NewRank,
    DateTime OccurredAt
) : IDomainEvent;