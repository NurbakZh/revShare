namespace oracle.Services.Interfaces;

public interface ISolanaService
{
    string OraclePublicKey { get; }
    Task<string?> DistributeRevenueAsync(string businessPubkey, ulong revenueAmount, CancellationToken ct = default);
    Task<bool> IsHealthyAsync(CancellationToken ct = default);
}