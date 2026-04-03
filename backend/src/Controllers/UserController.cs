using Microsoft.AspNetCore.Mvc;
using oracle.DTOs;
using oracle.Services.Interfaces;

namespace oracle.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController(IUserService userService) : ControllerBase
{
    private readonly IUserService _userService = userService;

    [HttpGet("{pubkey}")]
    public async Task<IActionResult> GetByPubkey(string pubkey, CancellationToken ct)
    {
        var result = await _userService.GetByPubkeyAsync(pubkey, ct);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterUserDto dto,
        CancellationToken ct)
    {
        var result = await _userService.RegisterAsync(dto, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}