using oracle.DTOs;
using oracle.Models;

namespace oracle.Services.Interfaces;

public interface IBusinessService
{
    Task<Result<BusinessProfile>> GetByPubkeyAsync(string pubkey, CancellationToken ct = default);
    Task<Result<IReadOnlyList<BusinessProfile>>> GetAllActiveAsync(CancellationToken ct = default);
    Task<Result<BusinessProfile>> RegisterAsync(RegisterBusinessDto dto, CancellationToken ct = default);
}