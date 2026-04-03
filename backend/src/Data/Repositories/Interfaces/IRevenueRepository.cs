using oracle.Models;

namespace oracle.Data.Repositories.Interfaces;

public interface IRevenueRepository : IRepository<RevenueRecord>
{
    Task<IReadOnlyList<RevenueRecord>> GetByBusinessPubkeyAsync(string pubkey, CancellationToken ct = default);
    Task<RevenueRecord?> GetLatestByBusinessAsync(string pubkey, CancellationToken ct = default);
}