using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using oracle.Data.Repositories.Interfaces;
using oracle.DTOs;
using oracle.Models;
using oracle.Services;

namespace tests.Tests;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userRepoMock = new Mock<IUserRepository>();
        _userService = new UserService(
            _userRepoMock.Object,
            NullLogger<UserService>.Instance);
    }

    [Fact]
    public async Task GetByPubkey_WhenExists_ReturnsSuccess()
    {
        var user = UserProfile.Create("pubkey123", "Aibar");

        _userRepoMock
            .Setup(x => x.GetByPubkeyAsync("pubkey123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var result = await _userService.GetByPubkeyAsync("pubkey123");

        result.Success.Should().BeTrue();
        result.Data!.Name.Should().Be("Aibar");
    }

    [Fact]
    public async Task GetByPubkey_WhenNotExists_ReturnsFail()
    {
        _userRepoMock
            .Setup(x => x.GetByPubkeyAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserProfile?)null);

        var result = await _userService.GetByPubkeyAsync("nonexistent");

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Register_WhenNewUser_ReturnsSuccess()
    {
        var dto = new RegisterUserDto("pubkey123", "Aibar", null, "Web3 dev");

        _userRepoMock
            .Setup(x => x.GetByPubkeyAsync("pubkey123", It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserProfile?)null);
        _userRepoMock
            .Setup(x => x.AddAsync(It.IsAny<UserProfile>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _userRepoMock
            .Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _userService.RegisterAsync(dto);

        result.Success.Should().BeTrue();
        result.Data!.Pubkey.Should().Be("pubkey123");
        result.Data.Bio.Should().Be("Web3 dev");
    }

    [Fact]
    public async Task Register_WhenAlreadyExists_ReturnsFail()
    {
        var existing = UserProfile.Create("pubkey123", "Aibar");
        var dto = new RegisterUserDto("pubkey123", "Aibar");

        _userRepoMock
            .Setup(x => x.GetByPubkeyAsync("pubkey123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var result = await _userService.RegisterAsync(dto);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("already registered");
    }
}