using Microsoft.AspNetCore.Mvc;
using oracle.DTOs;
using oracle.Services.Interfaces;

namespace oracle.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BusinessController(
    IBusinessService businessService,
    IRevenueService revenueService) : ControllerBase
{
    private readonly IBusinessService _businessService = businessService;
    private readonly IRevenueService _revenueService = revenueService;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _businessService.GetAllActiveAsync(ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{pubkey}")]
    public async Task<IActionResult> GetByPubkey(string pubkey, CancellationToken ct)
    {
        var result = await _businessService.GetByPubkeyAsync(pubkey, ct);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterBusinessDto dto,
        CancellationToken ct)
    {
        var result = await _businessService.RegisterAsync(dto, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{pubkey}/revenue/history")]
    public async Task<IActionResult> GetRevenueHistory(string pubkey, CancellationToken ct)
    {
        var history = await _revenueService.GetHistoryAsync(pubkey, ct);
        return Ok(Result<object>.Ok(history));
    }

    [HttpPost("{pubkey}/revenue/simulate")]
    public async Task<IActionResult> SimulateRevenue(string pubkey, CancellationToken ct)
    {
        var businessResult = await _businessService.GetByPubkeyAsync(pubkey, ct);
        if (!businessResult.Success)
            return NotFound(businessResult);

        try
        {
            var record = await _revenueService.SimulateAndDistributeAsync(pubkey, ct);
            return Ok(Result<object>.Ok(record));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(Result<object>.Fail(ex.Message));
        }
    }
}