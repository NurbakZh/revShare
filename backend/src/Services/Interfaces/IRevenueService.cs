using oracle.Models;

namespace oracle.Services.Interfaces;

public interface IRevenueService
{
    Task<RevenueRecord> SimulateAndDistributeAsync(string businessPubkey, CancellationToken ct = default);
    Task<IReadOnlyList<RevenueRecord>> GetHistoryAsync(string businessPubkey, CancellationToken ct = default);
}