using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using oracle.Models;

namespace oracle.Data.Configurations;

public class BusinessProfileConfiguration : IEntityTypeConfiguration<BusinessProfile>
{
    public void Configure(EntityTypeBuilder<BusinessProfile> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Pubkey)
            .IsRequired()
            .HasMaxLength(44);

        builder.HasIndex(x => x.Pubkey)
            .IsUnique();

        builder.Property(x => x.OwnerPubkey)
            .IsRequired()
            .HasMaxLength(44);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Description);

        builder.Property(x => x.City)
            .HasMaxLength(100);

        builder.Property(x => x.LogoUrl)
            .HasMaxLength(500);

        builder.Property(x => x.Rank)
            .HasConversion<int>();

        builder.Ignore(x => x.DomainEvents);
    }
}