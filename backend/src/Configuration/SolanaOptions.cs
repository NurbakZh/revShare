namespace oracle.Configuration;

public class SolanaOptions
{
    public const string SectionName = "Solana";

    public string RpcUrl { get; set; } = "https://api.devnet.solana.com";
    public string ProgramId { get; set; } = string.Empty;
    public string? OraclePrivateKey { get; set; }
    public int MinMonthlyRevenue { get; set; } = int.MaxValue / 10; // 1% of max by default to avoid out-of-lamports errors during testing
    public int MaxMonthlyRevenue { get; set; } = int.MaxValue;
}