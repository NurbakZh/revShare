using Microsoft.AspNetCore.Mvc;
using oracle.Services.Interfaces;

namespace oracle.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarketplaceController(IMarketplaceService marketplaceService) : ControllerBase
{
    private readonly IMarketplaceService _marketplaceService = marketplaceService;

    [HttpGet("listings")]
    public async Task<IActionResult> GetActiveListings(CancellationToken ct)
    {
        var result = await _marketplaceService.GetActiveListingsAsync(ct);
        return Ok(result);
    }

    [HttpGet("listings/{businessPubkey}")]
    public async Task<IActionResult> GetListingsByBusiness(
        string businessPubkey,
        CancellationToken ct)
    {
        var result = await _marketplaceService.GetByBusinessAsync(businessPubkey, ct);
        return Ok(result);
    }
}