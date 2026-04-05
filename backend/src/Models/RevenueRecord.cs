using oracle.Models.Common;
using oracle.Models.Events;

namespace oracle.Models;

public class RevenueRecord : BaseAuditableEntity
{
    public string BusinessPubkey { get; private set; } = string.Empty;
    public ulong Epoch { get; private set; }
    public ulong Amount { get; private set; }
    public string Source { get; private set; } = "mock";
    public string? TxSignature { get; private set; }

    private RevenueRecord() { }

    public static RevenueRecord Create(
        string businessPubkey,
        ulong epoch,
        ulong amount,
        string source = "mock",
        string? txSignature = null)
    {
        return new RevenueRecord
        {
            BusinessPubkey = businessPubkey,
            Epoch = epoch,
            Amount = amount,
            Source = source,
            TxSignature = txSignature,
        };
    }
}