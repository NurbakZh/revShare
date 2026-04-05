using oracle.Data.Repositories.Interfaces;
using oracle.DTOs;
using oracle.Models;
using oracle.Services.Interfaces;

namespace oracle.Services;

public class BusinessService(
    IBusinessRepository businessRepository,
    ILogger<BusinessService> logger) : IBusinessService
{
    private readonly IBusinessRepository _businessRepository = businessRepository;
    private readonly ILogger<BusinessService> _logger = logger;

    public async Task<Result<BusinessProfile>> GetByPubkeyAsync(
        string pubkey,
        CancellationToken ct = default)
    {
        var business = await _businessRepository.GetByPubkeyAsync(pubkey, ct);
        return business is null
            ? Result<BusinessProfile>.Fail($"Business {pubkey} not found")
            : Result<BusinessProfile>.Ok(business);
    }

    public async Task<Result<IReadOnlyList<BusinessProfile>>> GetAllActiveAsync(
        CancellationToken ct = default)
    {
        var businesses = await _businessRepository.GetAllActiveAsync(ct);
        return Result<IReadOnlyList<BusinessProfile>>.Ok(businesses);
    }

    public async Task<Result<BusinessProfile>> RegisterAsync(
        RegisterBusinessDto dto,
        CancellationToken ct = default)
    {
        var existing = await _businessRepository.GetByPubkeyAsync(dto.Pubkey, ct);
        if (existing is not null)
            return Result<BusinessProfile>.Fail($"Business {dto.Pubkey} already registered");

        var business = BusinessProfile.Create(
            dto.Pubkey,
            dto.OwnerPubkey,
            dto.Name,
            dto.Description,
            dto.City,
            dto.RaiseLimit,
            dto.TargetRevenue,
            dto.LogoUrl);

        await _businessRepository.AddAsync(business, ct);
        await _businessRepository.SaveChangesAsync(ct);

        _logger.LogInformation("Business registered: {Pubkey}", dto.Pubkey);
        return Result<BusinessProfile>.Ok(business);
    }
}