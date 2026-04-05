using oracle.Data.Repositories.Interfaces;
using oracle.DTOs;
using oracle.Models;
using oracle.Services.Interfaces;

namespace oracle.Services;

public class UserService(IUserRepository userRepository, ILogger<UserService> logger) : IUserService
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly ILogger<UserService> _logger = logger;

    public async Task<Result<UserProfile>> GetByPubkeyAsync(
        string pubkey,
        CancellationToken ct = default)
    {
        var user = await _userRepository.GetByPubkeyAsync(pubkey, ct);
        return user is null
            ? Result<UserProfile>.Fail($"User {pubkey} not found")
            : Result<UserProfile>.Ok(user);
    }

    public async Task<Result<UserProfile>> RegisterAsync(
        RegisterUserDto dto,
        CancellationToken ct = default)
    {
        var existing = await _userRepository.GetByPubkeyAsync(dto.Pubkey, ct);
        if (existing is not null)
            return Result<UserProfile>.Fail($"User {dto.Pubkey} already registered");

        var user = UserProfile.Create(dto.Pubkey, dto.Name, dto.AvatarUrl, dto.Bio);

        await _userRepository.AddAsync(user, ct);
        await _userRepository.SaveChangesAsync(ct);

        _logger.LogInformation("User registered: {Pubkey}", dto.Pubkey);
        return Result<UserProfile>.Ok(user);
    }
}