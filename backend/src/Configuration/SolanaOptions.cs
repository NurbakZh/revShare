namespace oracle.Configuration;

public class SolanaOptions
{
    public const string SectionName = "Solana";

    public string RpcUrl { get; set; } = "https://api.devnet.solana.com";
    public string ProgramId { get; set; } = string.Empty;
    public string? OraclePrivateKey { get; set; }
    public int MinMonthlyRevenue { get; set; } = 50_000;
    public int MaxMonthlyRevenue { get; set; } = 200_000;
}