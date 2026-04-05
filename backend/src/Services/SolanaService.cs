using Microsoft.Extensions.Options;
using oracle.Configuration;
using oracle.Services.Interfaces;
using Solnet.Rpc;
using Solnet.Wallet;
using Solnet.Wallet.Bip39;

namespace oracle.Services;

public class SolanaService : ISolanaService
{
    private readonly IRpcClient _rpcClient;
    private readonly Wallet _oracleWallet;
    private readonly ILogger<SolanaService> _logger;

    public SolanaService(IOptions<SolanaOptions> options, ILogger<SolanaService> logger)
    {
        _logger = logger;
        var config = options.Value;

        _rpcClient = ClientFactory.GetClient(config.RpcUrl);

        _oracleWallet = config.OraclePrivateKey is not null
            ? new Wallet(config.OraclePrivateKey)
            : new Wallet(WordCount.Twelve, WordList.English);

        _logger.LogInformation("Oracle public key: {PubKey}", OraclePublicKey);
    }

    public string OraclePublicKey => _oracleWallet.Account.PublicKey.Key;

    public async Task<string?> DistributeRevenueAsync(
        string businessPubkey,
        ulong revenueAmount,
        CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation(
                "Distributing revenue for {Business}: {Amount} lamports",
                businessPubkey, revenueAmount);

            var blockHash = await _rpcClient.GetRecentBlockHashAsync();
            if (!blockHash.WasSuccessful)
            {
                _logger.LogError("Failed to get blockhash: {Reason}", blockHash.Reason);
                return null;
            }

            // TODO: serialize Anchor instruction and send transaction
            // For hackathon demo — returning simulated signature
            var signature = $"sim_{Guid.NewGuid():N}";
            _logger.LogInformation("Transaction sent: {Sig}", signature);
            return signature;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to distribute revenue for {Business}", businessPubkey);
            return null;
        }
    }

    public async Task<bool> IsHealthyAsync(CancellationToken ct = default)
    {
        var result = await _rpcClient.GetHealthAsync();
        return result.WasSuccessful;
    }
}