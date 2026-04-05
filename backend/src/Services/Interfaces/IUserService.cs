using oracle.DTOs;
using oracle.Models;

namespace oracle.Services.Interfaces;

public interface IUserService
{
    Task<Result<UserProfile>> GetByPubkeyAsync(string pubkey, CancellationToken ct = default);
    Task<Result<UserProfile>> RegisterAsync(RegisterUserDto dto, CancellationToken ct = default);
}