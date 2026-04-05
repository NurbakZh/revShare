using FluentAssertions;
using oracle.Models;
using oracle.Models.Enums;
using oracle.Models.Events;

namespace tests.Tests;

public class BusinessProfileTests
{
    private static BusinessProfile CreateBusiness() =>
        BusinessProfile.Create("pk", "owner", "Coffee", "desc", "Astana", 1000, 5000);

    [Fact]
    public void Create_SetsDefaultValues()
    {
        var business = CreateBusiness();

        business.Rank.Should().Be(BusinessRank.Newcomer);
        business.ConsecutivePayments.Should().Be(0);
        business.HasDefaulted.Should().BeFalse();
        business.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void RecordSuccessfulPayment_IncrementsCounter()
    {
        var business = CreateBusiness();

        business.RecordSuccessfulPayment();
        business.RecordSuccessfulPayment();

        business.ConsecutivePayments.Should().Be(2);
        business.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void RecordDefault_SetsDefaultedAndResetsPayments()
    {
        var business = CreateBusiness();
        business.RecordSuccessfulPayment();
        business.RecordSuccessfulPayment();

        business.RecordDefault();

        business.HasDefaulted.Should().BeTrue();
        business.ConsecutivePayments.Should().Be(0);
    }

    [Fact]
    public void UpgradeRank_RaisesEvent()
    {
        var business = CreateBusiness();

        business.UpgradeRank(BusinessRank.Verified);

        business.Rank.Should().Be(BusinessRank.Verified);
        business.DomainEvents.Should().HaveCount(1);
        business.DomainEvents[0].Should().BeOfType<BusinessRankUpgradedEvent>();
    }

    [Fact]
    public void UpgradeRank_WhenDowngrade_DoesNothing()
    {
        var business = CreateBusiness();
        business.UpgradeRank(BusinessRank.Verified);
        business.ClearDomainEvents();

        business.UpgradeRank(BusinessRank.Newcomer);

        business.Rank.Should().Be(BusinessRank.Verified);
        business.DomainEvents.Should().BeEmpty();
    }
}