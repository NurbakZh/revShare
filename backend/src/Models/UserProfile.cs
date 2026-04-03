using oracle.Models.Common;

namespace oracle.Models;

public class UserProfile : BaseAuditableEntity
{
    public string Pubkey { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? AvatarUrl { get; private set; }
    public string? Bio { get; private set; }
    public bool HasBusiness { get; private set; }

    private UserProfile() { }

    public static UserProfile Create(
        string pubkey,
        string name,
        string? avatarUrl = null,
        string? bio = null)
    {
        return new UserProfile
        {
            Pubkey = pubkey,
            Name = name,
            AvatarUrl = avatarUrl,
            Bio = bio,
        };
    }

    public void MarkHasBusiness()
    {
        HasBusiness = true;
        SetUpdatedAt();
    }
}