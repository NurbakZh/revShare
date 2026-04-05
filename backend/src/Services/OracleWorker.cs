using oracle.Data.Repositories.Interfaces;
using oracle.Services.Interfaces;

namespace oracle.Services;

public class OracleWorker : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromDays(30);

    private readonly IServiceProvider _services;
    private readonly ILogger<OracleWorker> _logger;

    public OracleWorker(IServiceProvider services, ILogger<OracleWorker> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OracleWorker started. Interval: {Interval}", Interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(Interval, stoppingToken);
            await RunDistributionCycleAsync(stoppingToken);
        }
    }

    private async Task RunDistributionCycleAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();

        var businessRepository = scope.ServiceProvider.GetRequiredService<IBusinessRepository>();
        var revenueService = scope.ServiceProvider.GetRequiredService<IRevenueService>();
        var rankService = scope.ServiceProvider.GetRequiredService<IRankService>();

        var businesses = await businessRepository.GetAllActiveAsync(ct);
        _logger.LogInformation("Running distribution cycle for {Count} businesses", businesses.Count);

        foreach (var business in businesses)
        {
            try
            {
                await revenueService.SimulateAndDistributeAsync(business.Pubkey, ct);
                await rankService.EvaluateAndUpgradeAsync(business, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Distribution failed for {Business}", business.Pubkey);
            }
        }
    }
}