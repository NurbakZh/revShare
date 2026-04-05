using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using oracle.Models;

namespace oracle.Data.Configurations;

public class TokenListingConfiguration : IEntityTypeConfiguration<TokenListing>
{
    public void Configure(EntityTypeBuilder<TokenListing> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ListingPubkey)
            .IsRequired()
            .HasMaxLength(44);

        builder.HasIndex(x => x.ListingPubkey)
            .IsUnique();

        builder.Property(x => x.BusinessPubkey)
            .IsRequired()
            .HasMaxLength(44);

        builder.Property(x => x.SellerPubkey)
            .IsRequired()
            .HasMaxLength(44);

        builder.Property(x => x.Status)
            .HasConversion<int>();

        builder.HasIndex(x => x.BusinessPubkey);
    }
}