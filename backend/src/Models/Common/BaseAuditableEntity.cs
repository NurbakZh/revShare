namespace oracle.Models.Common;

public abstract class BaseAuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    public void SetUpdatedAt() => UpdatedAt = DateTime.UtcNow;
}