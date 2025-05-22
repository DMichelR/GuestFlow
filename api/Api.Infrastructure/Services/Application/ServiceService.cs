// Api.Infrastructure/Services/Application/ServiceService.cs
using Api.Application.DTOs.Service;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.ServiceRelated;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class ServiceService : IServiceService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<ServiceService> _logger;

    public ServiceService(
        IApplicationDbContext dbContext,
        IJwtContextService jwtContextService,
        ILogger<ServiceService> logger)
    {
        _dbContext = dbContext;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    public async Task<ServiceDto> GetByIdAsync(Guid id)
    {
        var service = await _dbContext.Services
            .Include(s => s.Tenant)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        return service != null ? MapToDto(service) : null!;
    }

    public async Task<IEnumerable<ServiceDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<ServiceDto>();
        }
        
        var services = await _dbContext.Services
            .Include(s => s.Tenant)
            .Where(s => s.TenantId == tenantId.Value)
            .ToListAsync();
            
        return services.Select(MapToDto);
    }

    public async Task<ServiceDto> CreateAsync(CreateServiceDto dto)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }

        // Verificar que el nombre del servicio no esté duplicado para este tenant
        if (await _dbContext.Services.AnyAsync(s => s.Name == dto.Name && s.TenantId == tenantId.Value))
        {
            throw new InvalidOperationException($"Service with name {dto.Name} already exists");
        }

        var tenant = await _dbContext.Tenants.FindAsync(tenantId.Value);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }

        var service = new Service
        {
            Name = dto.Name,
            Description = dto.Description,
            TenantId = tenantId.Value,
            Tenant = tenant
        };

        await _dbContext.Services.AddAsync(service);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(service.Id);
    }

    public async Task<ServiceDto> UpdateAsync(Guid id, UpdateServiceDto dto)
    {
        var service = await _dbContext.Services.FindAsync(id);
        if (service == null) return null!;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || service.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Actualizar propiedades si se proporcionaron
        if (!string.IsNullOrEmpty(dto.Name) && dto.Name != service.Name)
        {
            // Verificar que el nuevo nombre no esté duplicado
            if (await _dbContext.Services.AnyAsync(s => s.Name == dto.Name && s.TenantId == tenantId.Value && s.Id != id))
            {
                throw new InvalidOperationException($"Service with name {dto.Name} already exists");
            }
            service.Name = dto.Name;
        }

        if (!string.IsNullOrEmpty(dto.Description))
        {
            service.Description = dto.Description;
        }

        _dbContext.Services.Update(service);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var service = await _dbContext.Services.FindAsync(id);
        
        if (service == null) return false;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || service.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT when deleting service");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Verificar si el servicio está en uso (tiene relaciones con ServiceTickets)
        var inUse = await _dbContext.ServiceTickets.AnyAsync(st => st.ServiceId == id);
        if (inUse)
        {
            throw new InvalidOperationException("Cannot delete service that is in use");
        }

        _dbContext.Services.Remove(service);
        var result = await _dbContext.SaveChangesAsync();
        return result > 0;
    }

    private ServiceDto MapToDto(Service service)
    {
        return new ServiceDto
        {
            Id = service.Id,
            Name = service.Name,
            Description = service.Description,
            TenantId = service.TenantId,
            TenantName = service.Tenant?.Name ?? string.Empty,
            Created = service.Created,
            Updated = service.Updated
        };
    }
}
