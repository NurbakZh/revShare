using oracle.Data.Repositories.Interfaces;
using oracle.Models;
using oracle.Models.Enums;
using oracle.Services.Interfaces;

namespace oracle.Services;

public class RankService(IBusinessRepository businessRepository, ILogger<RankService> logger) : IRankService
{
    private static readonly Dictionary<BusinessRank, ulong> RaiseLimits = new()
    {
        [BusinessRank.Newcomer] = 3_333_333,
        [BusinessRank.Verified] = 13_333_333,
        [BusinessRank.Reliable] = 66_666_667,
        [BusinessRank.Partner]  = ulong.MaxValue,
    };

    private readonly IBusinessRepository _businessRepository = businessRepository;
    private readonly ILogger<RankService> _logger = logger;

    public ulong GetRaiseLimit(BusinessRank rank)
        => RaiseLimits[rank];

    public ulong GetMinCollateral(BusinessRank rank)
    {
        var limit = GetRaiseLimit(rank);
        return limit == ulong.MaxValue ? 0 : limit * 30 / 100;
    }

    public async Task<BusinessRank> EvaluateAndUpgradeAsync(
        BusinessProfile business,
        CancellationToken ct = default)
    {
        if (business.HasDefaulted)
            return BusinessRank.Newcomer;

        var newRank = business.ConsecutivePayments switch
        {
            >= 12 => BusinessRank.Reliable,
            >= 4  => BusinessRank.Verified,
            _     => BusinessRank.Newcomer,
        };

        if (newRank > business.Rank)
        {
            _logger.LogInformation(
                "Upgrading {Business} rank: {Old} → {New}",
                business.Pubkey, business.Rank, newRank);

            business.UpgradeRank(newRank);
            await _businessRepository.UpdateAsync(business, ct);
            await _businessRepository.SaveChangesAsync(ct);
        }

        return business.Rank;
    }
}