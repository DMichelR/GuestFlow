using Api.Application.DTOs.Profession;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.GuestRelated;
using Api.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class ProfessionService : IProfessionService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<ProfessionService> _logger;

    public ProfessionService(ApplicationDbContext context, IJwtContextService jwtContextService, ILogger<ProfessionService> logger)
    {
        _context = context;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    public async Task<ProfessionDto> GetByIdAsync(Guid id)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();

        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }

        var profession = await _context.Set<Profession>()
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId.Value);

        if (profession == null)
            return null!;

        return new ProfessionDto
        {
            Id = profession.Id,
            Name = profession.Name,
            TenantId = profession.TenantId
        };
    }

    public async Task<IEnumerable<ProfessionDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();

        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }

        try
        {
            var professions = await _context.Set<Profession>()
                .Where(p => p.TenantId == tenantId.Value)
                .OrderBy(p => p.Name)
                .ToListAsync();

            return professions.Select(p => new ProfessionDto
            {
                Id = p.Id,
                Name = p.Name,
                TenantId = p.TenantId
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all professions");
            throw;
        }
    }
}
