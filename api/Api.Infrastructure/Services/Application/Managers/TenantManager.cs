using Api.Application.DTOs;
using Api.Application.Interfaces;
using Api.Application.Interfaces.Repositories;
using Api.Domain.Entities;

namespace Api.Infrastructure.Services.Application.Managers;

public class TenantManager : ITenantManager
{
    private readonly ITenantRepository _tenantRepository;

    public TenantManager(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    public async Task<TenantDto> CreateAsync(CreateTenantDto dto)
    {
        var tenant = new Tenant { Name = dto.Name };
        var result = await _tenantRepository.CreateAsync(tenant);
        return new TenantDto(result.Id, result.Name, result.Created, result.Updated);
    }

    public async Task<TenantDto?> UpdateAsync(Guid id, UpdateTenantDto dto)
    {
        var tenant = await _tenantRepository.GetByIdAsync(id);
        if (tenant == null) return null;

        tenant.Name = dto.Name;
        tenant.UpdateTimestamp();
        
        bool updated = await _tenantRepository.UpdateAsync(tenant);
        return updated ? new TenantDto(tenant.Id, tenant.Name, tenant.Created, tenant.Updated) : null;
    }

    public async Task<IEnumerable<TenantDto>> GetAllAsync()
    {
        var tenants = await _tenantRepository.GetAllAsync();
        return tenants.Select(t => new TenantDto(t.Id, t.Name, t.Created, t.Updated));
    }

    public async Task<TenantDto?> GetByIdAsync(Guid id)
    {
        var tenant = await _tenantRepository.GetByIdAsync(id);
        return tenant == null ? null : new TenantDto(tenant.Id, tenant.Name, tenant.Created, tenant.Updated);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        return await _tenantRepository.DeleteAsync(id);
    }
}
