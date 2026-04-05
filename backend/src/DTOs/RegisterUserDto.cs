namespace oracle.DTOs;

public record RegisterUserDto(
    string Pubkey,
    string Name,
    string? AvatarUrl = null,
    string? Bio = null
);