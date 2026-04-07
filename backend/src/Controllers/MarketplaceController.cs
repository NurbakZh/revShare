using Microsoft.AspNetCore.Mvc;
using oracle.DTOs;
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

    [HttpPost("listings")]
    public async Task<IActionResult> RegisterListing(
        [FromBody] RegisterListingDto dto,
        CancellationToken ct)
    {
        var result = await _marketplaceService.RegisterListingAsync(dto, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("listings/{listingPubkey}")]
    public async Task<IActionResult> CancelListing(string listingPubkey, CancellationToken ct)
    {
        var result = await _marketplaceService.CancelListingAsync(listingPubkey, ct);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("listings/{listingPubkey}/sold")]
    public async Task<IActionResult> MarkSold(string listingPubkey, CancellationToken ct)
    {
        var result = await _marketplaceService.MarkSoldAsync(listingPubkey, ct);
        return result.Success ? Ok(result) : NotFound(result);
    }
}