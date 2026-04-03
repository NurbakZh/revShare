using oracle.Models.Common;

namespace oracle.Models.Events;

public record RevenueDistributedEvent(
    string BusinessPubkey,
    ulong Epoch,
    ulong Amount,
    DateTime OccurredAt
) : IDomainEvent;