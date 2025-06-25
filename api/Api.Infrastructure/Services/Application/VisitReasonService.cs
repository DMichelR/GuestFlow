// Api.Infrastructure/Services/Application/VisitReasonService.cs

using Api.Application.DTOs.VisitReason;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.StayRelated;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class VisitReasonService : IVisitReasonService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<VisitReasonService> _logger;

    public VisitReasonService(
        IApplicationDbContext dbContext,
        IJwtContextService jwtContextService,
        ILogger<VisitReasonService> logger)
    {
        _dbContext = dbContext;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    public async Task<VisitReasonDto> GetByIdAsync(Guid id)
    {
        var visitReason = await _dbContext.VisitReasons
            .Include(vr => vr.Tenant)
            .FirstOrDefaultAsync(vr => vr.Id == id);
            
        return visitReason != null ? MapToDto(visitReason) : null!;
    }

    public async Task<IEnumerable<VisitReasonDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<VisitReasonDto>();
        }
        
        var visitReasons = await _dbContext.VisitReasons
            .Include(vr => vr.Tenant)
            .Where(vr => vr.TenantId == tenantId.Value)
            .ToListAsync();
            
        return visitReasons.Select(MapToDto);
    }

    public async Task<VisitReasonDto> CreateAsync(CreateVisitReasonDto dto)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }

        // Verificar que el nombre de la razón de visita no esté duplicado para este tenant
        if (await _dbContext.VisitReasons.AnyAsync(vr => vr.Name == dto.Name && vr.TenantId == tenantId.Value))
        {
            throw new InvalidOperationException($"Visit reason with name {dto.Name} already exists");
        }

        var tenant = await _dbContext.Tenants.FindAsync(tenantId.Value);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }

        var visitReason = new VisitReason
        {
            Name = dto.Name,
            TenantId = tenantId.Value,
            Tenant = tenant
        };

        await _dbContext.VisitReasons.AddAsync(visitReason);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(visitReason.Id);
    }

    public async Task<VisitReasonDto> UpdateAsync(Guid id, UpdateVisitReasonDto dto)
    {
        var visitReason = await _dbContext.VisitReasons.FindAsync(id);
        if (visitReason == null) return null!;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || visitReason.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Actualizar propiedades si se proporcionaron
        if (!string.IsNullOrEmpty(dto.Name) && dto.Name != visitReason.Name)
        {
            // Verificar que el nuevo nombre no esté duplicado
            if (await _dbContext.VisitReasons.AnyAsync(vr => vr.Name == dto.Name && vr.TenantId == tenantId.Value && vr.Id != id))
            {
                throw new InvalidOperationException($"Visit reason with name {dto.Name} already exists");
            }
            visitReason.Name = dto.Name;
        }

        _dbContext.VisitReasons.Update(visitReason);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var visitReason = await _dbContext.VisitReasons.FindAsync(id);
        
        if (visitReason == null) return false;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || visitReason.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT when deleting visit reason");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Verificar si la razón de visita está en uso (tiene relaciones con Stays)
        var inUse = await _dbContext.Stays.AnyAsync(s => s.VisitReasonId == id);
        if (inUse)
        {
            throw new InvalidOperationException("Cannot delete visit reason that is in use");
        }

        // Soft delete: set IsActive to false instead of removing the record
        visitReason.IsActive = false;
        var result = await _dbContext.SaveChangesAsync();
        return result > 0;
    }

    private VisitReasonDto MapToDto(VisitReason visitReason)
    {
        return new VisitReasonDto
        {
            Id = visitReason.Id,
            Name = visitReason.Name,
            TenantId = visitReason.TenantId,
            TenantName = visitReason.Tenant?.Name ?? string.Empty,
            Created = visitReason.Created,
            Updated = visitReason.Updated
        };
    }
}
