using Microsoft.Extensions.Options;
using oracle.Configuration;
using oracle.Services.Interfaces;
using Solnet.Programs;
using Solnet.Rpc;
using Solnet.Rpc.Builders;
using Solnet.Rpc.Models;
using Solnet.Rpc.Types;
using Solnet.Wallet;
using Solnet.Wallet.Bip39;
using System.Numerics;
using System.Security.Cryptography;

namespace oracle.Services;

public class SolanaService : ISolanaService
{
    private readonly IRpcClient _rpcClient;
    private readonly Account _oracleAccount;
    private readonly SolanaOptions _options;
    private readonly ILogger<SolanaService> _logger;

    // Offsets within BusinessPool account data (after 8-byte Anchor discriminator):
    //   owner (32), oracle_authority (32), token_mint (32), id (8),
    //   total_tokens (8), tokens_sold (8), revenue_share_bps (2),
    //   collateral (8), token_price (8) → current_epoch starts at byte 146
    //   total_distributed (8), total_revenue (8), is_defaulted (1), ...
    private const int CurrentEpochOffset = 146;

    // Ed25519 curve parameters for correct PDA derivation.
    // Solnet 5.x TryFindProgramAddress has a buggy IsOnCurve check,
    // so we implement the algorithm from scratch using Solana's spec.
    private static readonly BigInteger Ed25519P = BigInteger.Pow(2, 255) - 19;
    // d = -121665 * modInverse(121666, p) mod p
    private static readonly BigInteger Ed25519D =
        (BigInteger.Pow(2, 255) - 19 - 121665) *
        BigInteger.ModPow(121666, BigInteger.Pow(2, 255) - 21, BigInteger.Pow(2, 255) - 19) %
        (BigInteger.Pow(2, 255) - 19);

    public SolanaService(IOptions<SolanaOptions> options, ILogger<SolanaService> logger)
    {
        _logger = logger;
        _options = options.Value;

        _rpcClient = ClientFactory.GetClient(_options.RpcUrl);

        if (_options.OraclePrivateKey is { Length: > 0 } key)
        {
            // Accept either a Solana keypair JSON byte array "[12,34,...]" (64 bytes from solana-keygen)
            // or a BIP39 mnemonic phrase (words separated by spaces).
            if (key.TrimStart().StartsWith('['))
            {
                var keypairInts = System.Text.Json.JsonSerializer.Deserialize<int[]>(key)!;
                var keypairBytes = Array.ConvertAll(keypairInts, b => (byte)b);
                _oracleAccount = new Account(keypairBytes, keypairBytes[32..]);
            }
            else
            {
                _oracleAccount = new Wallet(key).Account;
            }
        }
        else
        {
            _oracleAccount = new Wallet(WordCount.Twelve, WordList.English).Account;
            _logger.LogWarning(
                "OraclePrivateKey not set — generated ephemeral keypair. " +
                "Set Solana:OraclePrivateKey in appsettings to persist the oracle identity.");
        }

        _logger.LogInformation("Oracle public key: {PubKey}", OraclePublicKey);
    }

    public string OraclePublicKey => _oracleAccount.PublicKey.Key;

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

            // 1. Fetch business pool on-chain to get current epoch
            var accountInfo = await _rpcClient.GetAccountInfoAsync(
                businessPubkey, Commitment.Confirmed);

            if (!accountInfo.WasSuccessful || accountInfo.Result?.Value == null)
            {
                _logger.LogError(
                    "Failed to fetch business pool account {Business}: {Reason}",
                    businessPubkey, accountInfo.Reason);
                return null;
            }

            var rawData = Convert.FromBase64String(accountInfo.Result.Value.Data[0]);
            if (rawData.Length < CurrentEpochOffset + 8)
            {
                _logger.LogError(
                    "Business pool account data too short ({Len} bytes)", rawData.Length);
                return null;
            }

            var currentEpoch = BitConverter.ToUInt64(rawData, CurrentEpochOffset);
            _logger.LogInformation(
                "Business {Business} on-chain current_epoch = {Epoch}", businessPubkey, currentEpoch);

            // 2. Derive revenue_epoch PDA using correct Solana algorithm.
            //    seeds = ["epoch", business_pool_pubkey, current_epoch_le8]
            var programId = new PublicKey(_options.ProgramId);
            var businessPoolPk = new PublicKey(businessPubkey);
            var epochLeBytes = BitConverter.GetBytes(currentEpoch);

            byte[][] pdaSeeds = [
                System.Text.Encoding.UTF8.GetBytes("epoch"),
                businessPoolPk.KeyBytes,
                epochLeBytes,
            ];

            if (!SolanaFindProgramAddress(pdaSeeds, programId, out var revenueEpochPda, out _))
            {
                _logger.LogError("Failed to derive revenue_epoch PDA for epoch {Epoch}", currentEpoch);
                return null;
            }

            _logger.LogInformation(
                "revenue_epoch PDA = {Pda} (epoch {Epoch})", revenueEpochPda.Key, currentEpoch);

            // 3. Build Anchor instruction data: discriminator(8) + revenue_amount(8)
            var discriminator = SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes("global:distribute_revenue"))[..8];
            var instructionData = discriminator
                .Concat(BitConverter.GetBytes(revenueAmount))
                .ToArray();

            // 4. Derive funds_vault PDA: seeds = ["funds_vault", business_pool]
            byte[][] vaultSeeds = [
                System.Text.Encoding.UTF8.GetBytes("funds_vault"),
                businessPoolPk.KeyBytes,
            ];
            if (!SolanaFindProgramAddress(vaultSeeds, programId, out var fundsVaultPda, out _))
            {
                _logger.LogError("Failed to derive funds_vault PDA for {Business}", businessPubkey);
                return null;
            }

            // 5. Account metas (match DistributeRevenue struct order)
            var oraclePk = _oracleAccount.PublicKey;
            var keys = new List<AccountMeta>
            {
                AccountMeta.Writable(oraclePk, true),           // oracle (mut, signer)
                AccountMeta.Writable(businessPoolPk, false),    // business_pool (mut)
                AccountMeta.Writable(revenueEpochPda, false),   // revenue_epoch (mut, init)
                AccountMeta.Writable(fundsVaultPda, false),     // funds_vault (mut)
                AccountMeta.ReadOnly(SystemProgram.ProgramIdKey, false), // system_program
            };

            var instruction = new TransactionInstruction
            {
                ProgramId = programId,
                Keys = keys,
                Data = instructionData,
            };

            // 5. Get latest blockhash and build transaction
            var blockHash = await _rpcClient.GetLatestBlockHashAsync();
            if (!blockHash.WasSuccessful)
            {
                _logger.LogError("Failed to get blockhash: {Reason}", blockHash.Reason);
                return null;
            }

            var txBytes = new TransactionBuilder()
                .SetRecentBlockHash(blockHash.Result.Value.Blockhash)
                .SetFeePayer(oraclePk)
                .AddInstruction(instruction)
                .Build(new List<Account> { _oracleAccount });

            // 6. Send transaction
            var result = await _rpcClient.SendTransactionAsync(txBytes);
            if (!result.WasSuccessful)
            {
                _logger.LogError(
                    "distribute_revenue tx failed for {Business}: {Reason}",
                    businessPubkey, result.Reason);
                throw new InvalidOperationException(
                    $"Solana tx rejected: {result.Reason}");
            }

            _logger.LogInformation(
                "distribute_revenue tx sent for {Business}: {Sig}", businessPubkey, result.Result);
            return result.Result;
        }
        catch (InvalidOperationException)
        {
            throw;
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

    // ── Correct Solana PDA derivation ───────────────────────────────────────
    // Mirrors Solana's find_program_address / create_program_address exactly.
    // Solnet 5.x TryFindProgramAddress uses an incorrect IsOnCurve check and
    // may return the wrong bump / address.

    private static bool SolanaFindProgramAddress(
        byte[][] seeds, PublicKey programId,
        out PublicKey address, out byte bump)
    {
        for (int n = 255; n >= 1; n--)
        {
            // Append nonce as final seed (same as Solana's find_program_address)
            var seedsWithNonce = seeds.Append(new byte[] { (byte)n }).ToArray();
            var pk = SolanaCreateProgramAddress(seedsWithNonce, programId);
            if (pk is not null)
            {
                address = pk;
                bump = (byte)n;
                return true;
            }
        }
        address = null!;
        bump = 0;
        return false;
    }

    /// <summary>
    /// SHA-256( seed1 || seed2 || ... || seedN || programId || "ProgramDerivedAddress" )
    /// Returns null when the hash is a valid ed25519 point (on-curve → not a valid PDA).
    /// </summary>
    private static PublicKey? SolanaCreateProgramAddress(byte[][] seeds, PublicKey programId)
    {
        var buf = new List<byte>();
        foreach (var s in seeds) buf.AddRange(s);
        buf.AddRange(programId.KeyBytes);
        buf.AddRange(System.Text.Encoding.UTF8.GetBytes("ProgramDerivedAddress"));

        var hash = SHA256.HashData(buf.ToArray());
        // A valid PDA must NOT be a point on the ed25519 curve
        return IsOnEd25519Curve(hash) ? null : new PublicKey(hash);
    }

    /// <summary>
    /// Returns true when the 32 bytes can be decoded as a valid compressed ed25519 point.
    /// Uses the curve equation: x² = (y²-1) / (d·y²+1) mod p
    /// </summary>
    private static bool IsOnEd25519Curve(byte[] bytes)
    {
        var p = Ed25519P;

        // Read y from little-endian bytes; top bit of byte[31] is the sign of x
        var yBytes = (byte[])bytes.Clone();
        yBytes[31] &= 0x7F;
        var y = new BigInteger(yBytes, isUnsigned: true, isBigEndian: false);
        if (y >= p) return false;

        var y2 = y * y % p;
        var u = (y2 - 1 + p) % p;          // numerator:   y² - 1
        var v = (Ed25519D * y2 % p + 1) % p; // denominator: d·y² + 1
        var x2 = u * BigInteger.ModPow(v, p - 2, p) % p; // x² = u * v⁻¹ mod p

        if (x2 == BigInteger.Zero) return true; // x = 0 is on the curve

        // Euler's criterion: x² is a quadratic residue iff x²^((p-1)/2) ≡ 1 mod p
        return BigInteger.ModPow(x2, (p - 1) / 2, p) == BigInteger.One;
    }
}
