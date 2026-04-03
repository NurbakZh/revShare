using oracle.Models;

namespace oracle.Data.Repositories.Interfaces;

public interface IBusinessRepository : IRepository<BusinessProfile>
{
    Task<BusinessProfile?> GetByPubkeyAsync(string pubkey, CancellationToken ct = default);
    Task<IReadOnlyList<BusinessProfile>> GetAllActiveAsync(CancellationToken ct = default);
}