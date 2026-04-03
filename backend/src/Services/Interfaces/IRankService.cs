using oracle.Models;
using oracle.Models.Enums;

namespace oracle.Services.Interfaces;

public interface IRankService
{
    ulong GetRaiseLimit(BusinessRank rank);
    ulong GetMinCollateral(BusinessRank rank);
    Task<BusinessRank> EvaluateAndUpgradeAsync(BusinessProfile business, CancellationToken ct = default);
}