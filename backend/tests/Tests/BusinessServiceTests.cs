using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using oracle.Data.Repositories.Interfaces;
using oracle.DTOs;
using oracle.Models;
using oracle.Services;

namespace tests.Tests;

public class BusinessServiceTests
{
    private readonly Mock<IBusinessRepository> _businessRepoMock;
    private readonly BusinessService _businessService;

    public BusinessServiceTests()
    {
        _businessRepoMock = new Mock<IBusinessRepository>();
        _businessService = new BusinessService(
            _businessRepoMock.Object,
            NullLogger<BusinessService>.Instance);
    }

    [Fact]
    public async Task GetByPubkey_WhenExists_ReturnsSuccess()
    {
        var business = BusinessProfile.Create(
            "pubkey123", "owner", "Coffee", "desc", "Astana", 1000, 5000);

        _businessRepoMock
            .Setup(x => x.GetByPubkeyAsync("pubkey123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(business);

        var result = await _businessService.GetByPubkeyAsync("pubkey123");

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Pubkey.Should().Be("pubkey123");
    }

    [Fact]
    public async Task GetByPubkey_WhenNotExists_ReturnsFail()
    {
        _businessRepoMock
            .Setup(x => x.GetByPubkeyAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BusinessProfile?)null);

        var result = await _businessService.GetByPubkeyAsync("nonexistent");

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Register_WhenNewBusiness_ReturnsSuccess()
    {
        var dto = new RegisterBusinessDto(
            "pubkey123", "owner", "Coffee", "desc", "Astana", 1000, 5000);

        _businessRepoMock
            .Setup(x => x.GetByPubkeyAsync("pubkey123", It.IsAny<CancellationToken>()))
            .ReturnsAsync((BusinessProfile?)null);
        _businessRepoMock
            .Setup(x => x.AddAsync(It.IsAny<BusinessProfile>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _businessRepoMock
            .Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _businessService.RegisterAsync(dto);

        result.Success.Should().BeTrue();
        result.Data!.Name.Should().Be("Coffee");
        result.Data.City.Should().Be("Astana");
    }

    [Fact]
    public async Task Register_WhenAlreadyExists_ReturnsFail()
    {
        var existing = BusinessProfile.Create(
            "pubkey123", "owner", "Coffee", "desc", "Astana", 1000, 5000);

        var dto = new RegisterBusinessDto(
            "pubkey123", "owner", "Coffee", "desc", "Astana", 1000, 5000);

        _businessRepoMock
            .Setup(x => x.GetByPubkeyAsync("pubkey123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var result = await _businessService.RegisterAsync(dto);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("already registered");
    }

    [Fact]
    public async Task GetAllActive_ReturnsAllNonDefaulted()
    {
        var businesses = new List<BusinessProfile>
        {
            BusinessProfile.Create("pk1", "o1", "Biz1", "d", "Astana", 1000, 5000),
            BusinessProfile.Create("pk2", "o2", "Biz2", "d", "Almaty", 2000, 8000),
        };

        _businessRepoMock
            .Setup(x => x.GetAllActiveAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(businesses);

        var result = await _businessService.GetAllActiveAsync();

        result.Success.Should().BeTrue();
        result.Data.Should().HaveCount(2);
    }
}