namespace oracle.Models.Common;

public interface IDomainEvent
{
    DateTime OccurredAt { get; }
}