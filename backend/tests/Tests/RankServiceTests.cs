using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using oracle.Data.Repositories.Interfaces;
using oracle.Models;
using oracle.Models.Enums;
using oracle.Services;

namespace tests.Tests;

public class RankServiceTests
{
    private readonly Mock<IBusinessRepository> _businessRepoMock;
    private readonly RankService _rankService;

    public RankServiceTests()
    {
        _businessRepoMock = new Mock<IBusinessRepository>();
        _rankService = new RankService(
            _businessRepoMock.Object,
            NullLogger<RankService>.Instance);
    }

    [Theory]
    [InlineData(BusinessRank.Newcomer, 3_333_333ul)]
    [InlineData(BusinessRank.Verified, 13_333_333ul)]
    [InlineData(BusinessRank.Reliable, 66_666_667ul)]
    [InlineData(BusinessRank.Partner, ulong.MaxValue)]
    public void GetRaiseLimit_ReturnsCorrectLimit(BusinessRank rank, ulong expected)
    {
        var result = _rankService.GetRaiseLimit(rank);
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData(BusinessRank.Newcomer, 999_999ul)]
    [InlineData(BusinessRank.Verified, 3_999_999ul)]
    [InlineData(BusinessRank.Reliable, 20_000_000ul)]
    [InlineData(BusinessRank.Partner, 0ul)]
    public void GetMinCollateral_Returns30PercentOfRaiseLimit(BusinessRank rank, ulong expected)
    {
        var result = _rankService.GetMinCollateral(rank);
        result.Should().Be(expected);
    }

    [Fact]
    public async Task EvaluateAndUpgrade_WhenDefaulted_ReturnsNewcomer()
    {
        var business = BusinessProfile.Create(
            "pubkey", "owner", "name", "desc", "city", 1000, 5000);
        business.RecordDefault();

        var result = await _rankService.EvaluateAndUpgradeAsync(business);

        result.Should().Be(BusinessRank.Newcomer);
        _businessRepoMock.Verify(x => x.UpdateAsync(It.IsAny<BusinessProfile>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task EvaluateAndUpgrade_After4Payments_UpgradesToVerified()
    {
        var business = BusinessProfile.Create(
            "pubkey", "owner", "name", "desc", "city", 1000, 5000);

        for (var i = 0; i < 4; i++)
            business.RecordSuccessfulPayment();

        _businessRepoMock
            .Setup(x => x.UpdateAsync(It.IsAny<BusinessProfile>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _businessRepoMock
            .Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _rankService.EvaluateAndUpgradeAsync(business);

        result.Should().Be(BusinessRank.Verified);
        _businessRepoMock.Verify(x => x.UpdateAsync(business, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task EvaluateAndUpgrade_After12Payments_UpgradesToReliable()
    {
        var business = BusinessProfile.Create(
            "pubkey", "owner", "name", "desc", "city", 1000, 5000);

        for (var i = 0; i < 12; i++)
            business.RecordSuccessfulPayment();

        _businessRepoMock
            .Setup(x => x.UpdateAsync(It.IsAny<BusinessProfile>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _businessRepoMock
            .Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _rankService.EvaluateAndUpgradeAsync(business);

        result.Should().Be(BusinessRank.Reliable);
    }

    [Fact]
    public async Task EvaluateAndUpgrade_WhenRankNotChanged_DoesNotCallUpdate()
    {
        var business = BusinessProfile.Create(
            "pubkey", "owner", "name", "desc", "city", 1000, 5000);

        // 0 payments — stays Newcomer
        var result = await _rankService.EvaluateAndUpgradeAsync(business);

        result.Should().Be(BusinessRank.Newcomer);
        _businessRepoMock.Verify(x => x.UpdateAsync(It.IsAny<BusinessProfile>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}