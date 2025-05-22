using Api.Application.DTOs;

namespace Api.Application.Interfaces;

public interface ITenantService
{
    Task<TenantDto> CreateAsync(CreateTenantDto dto);
    Task<TenantDto?> UpdateAsync(Guid id, UpdateTenantDto dto);
    Task<IEnumerable<TenantDto>> GetAllAsync();
    Task<TenantDto?> GetByIdAsync(Guid id);
    Task<bool> DeleteAsync(Guid id);
}
