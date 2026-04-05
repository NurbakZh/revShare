using Microsoft.AspNetCore.Mvc;
using oracle.DTOs;
using oracle.Services.Interfaces;

namespace oracle.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(ISolanaService solanaService) : ControllerBase
{
    private readonly ISolanaService _solanaService = solanaService;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var solanaHealthy = await _solanaService.IsHealthyAsync(ct);
        return Ok(Result<object>.Ok(new
        {
            Status = solanaHealthy ? "healthy" : "degraded",
            Solana = solanaHealthy,
            OraclePublicKey = _solanaService.OraclePublicKey,
            Timestamp = DateTime.UtcNow
        }));
    }
}