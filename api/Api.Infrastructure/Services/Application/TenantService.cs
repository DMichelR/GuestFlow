using Api.Application.DTOs;
using Api.Application.Interfaces;
using Api.Application.Interfaces.Repositories;
using Api.Domain.Entities;

namespace Api.Infrastructure.Services.Application;

public class TenantService : ITenantService
{
    private readonly ITenantRepository _tenantRepository;

    public TenantService(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    public async Task<TenantDto> CreateAsync(CreateTenantDto dto)
    {
        var tenant = new Tenant { 
            Name = dto.Name,
            Address = dto.Address,
            CountryId = dto.CountryId,
            CityId = dto.CityId,
            IsActive = true
        };
        var result = await _tenantRepository.CreateAsync(tenant);
        return new TenantDto(
            result.Id, 
            result.Name,
            result.Address,
            result.CountryId,
            result.CityId,
            result.Country?.Name,
            result.City?.Name,
            result.IsActive,
            result.Created, 
            result.Updated
        );
    }

    public async Task<TenantDto?> UpdateAsync(Guid id, UpdateTenantDto dto)
    {
        var tenant = await _tenantRepository.GetByIdAsync(id);
        if (tenant == null) return null;

        if (dto.Name != null)
            tenant.Name = dto.Name;
            
        if (dto.Address != null)
            tenant.Address = dto.Address;
            
        if (dto.CountryId.HasValue)
            tenant.CountryId = dto.CountryId;
            
        if (dto.CityId.HasValue)
            tenant.CityId = dto.CityId;
            
        if (dto.IsActive.HasValue)
            tenant.IsActive = dto.IsActive.Value;
            
        tenant.UpdateTimestamp();
        
        bool updated = await _tenantRepository.UpdateAsync(tenant);
        return updated ? new TenantDto(
            tenant.Id, 
            tenant.Name,
            tenant.Address,
            tenant.CountryId,
            tenant.CityId,
            tenant.Country?.Name,
            tenant.City?.Name,
            tenant.IsActive,
            tenant.Created, 
            tenant.Updated
        ) : null;
    }

    public async Task<IEnumerable<TenantDto>> GetAllAsync()
    {
        var tenants = await _tenantRepository.GetAllAsync();
        return tenants.Select(t => new TenantDto(
            t.Id, 
            t.Name,
            t.Address,
            t.CountryId,
            t.CityId,
            t.Country?.Name,
            t.City?.Name,
            t.IsActive,
            t.Created, 
            t.Updated
        ));
    }

    public async Task<TenantDto?> GetByIdAsync(Guid id)
    {
        var tenant = await _tenantRepository.GetByIdAsync(id);
        return tenant == null ? null : new TenantDto(
            tenant.Id, 
            tenant.Name,
            tenant.Address,
            tenant.CountryId,
            tenant.CityId,
            tenant.Country?.Name,
            tenant.City?.Name,
            tenant.IsActive,
            tenant.Created, 
            tenant.Updated
        );
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        // En vez de eliminar el tenant, lo marcamos como inactivo
        var tenant = await _tenantRepository.GetByIdAsync(id);
        if (tenant == null) return false;
        
        tenant.IsActive = false;
        return await _tenantRepository.UpdateAsync(tenant);
    }
}
