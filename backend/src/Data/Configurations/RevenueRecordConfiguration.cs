using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using oracle.Models;

namespace oracle.Data.Configurations;

public class RevenueRecordConfiguration : IEntityTypeConfiguration<RevenueRecord>
{
    public void Configure(EntityTypeBuilder<RevenueRecord> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.BusinessPubkey)
            .IsRequired()
            .HasMaxLength(44);

        builder.Property(x => x.Source)
            .HasMaxLength(50);

        builder.Property(x => x.TxSignature)
            .HasMaxLength(100);

        builder.HasIndex(x => x.BusinessPubkey);
    }
}