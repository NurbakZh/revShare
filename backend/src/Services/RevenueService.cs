using Microsoft.Extensions.Options;
using oracle.Configuration;
using oracle.Data.Repositories.Interfaces;
using oracle.Models;
using oracle.Services.Interfaces;

namespace oracle.Services;

public class RevenueService(
    ISolanaService solana,
    IRevenueRepository revenueRepository,
    IBusinessRepository businessRepository,
    IOptions<SolanaOptions> options,
    ILogger<RevenueService> logger) : IRevenueService
{
    private readonly ISolanaService _solana = solana;
    private readonly IRevenueRepository _revenueRepository = revenueRepository;
    private readonly IBusinessRepository _businessRepository = businessRepository;
    private readonly SolanaOptions _options = options.Value;
    private readonly ILogger<RevenueService> _logger = logger;

    public async Task<RevenueRecord> SimulateAndDistributeAsync(
        string businessPubkey,
        CancellationToken ct = default)
    {
        var business = await _businessRepository.GetByPubkeyAsync(businessPubkey, ct)
            ?? throw new InvalidOperationException($"Business {businessPubkey} not found");

        var revenue = (ulong)Random.Shared.NextInt64(
            _options.MinMonthlyRevenue,
            _options.MaxMonthlyRevenue);

        var txSignature = await _solana.DistributeRevenueAsync(businessPubkey, revenue, ct);

        var latest = await _revenueRepository.GetLatestByBusinessAsync(businessPubkey, ct);
        var nextEpoch = latest is null ? 0 : latest.Epoch + 1;

        var record = RevenueRecord.Create(
            businessPubkey,
            nextEpoch,
            revenue,
            source: "mock_pos",
            txSignature: txSignature);

        await _revenueRepository.AddAsync(record, ct);
        await _revenueRepository.SaveChangesAsync(ct);

        business.RecordSuccessfulPayment();
        await _businessRepository.UpdateAsync(business, ct);
        await _businessRepository.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Revenue distributed for {Business}: {Amount} lamports (epoch {Epoch})",
            businessPubkey, revenue, nextEpoch);

        return record;
    }

    public async Task<IReadOnlyList<RevenueRecord>> GetHistoryAsync(
        string businessPubkey,
        CancellationToken ct = default)
        => await _revenueRepository.GetByBusinessPubkeyAsync(businessPubkey, ct);
}