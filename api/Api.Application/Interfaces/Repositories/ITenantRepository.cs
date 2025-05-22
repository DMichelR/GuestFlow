using Api.Domain.Entities;

namespace Api.Application.Interfaces.Repositories;

public interface ITenantRepository
{
    Task<Tenant> CreateAsync(Tenant tenant);
    Task<bool> UpdateAsync(Tenant tenant);
    Task<Tenant?> GetByIdAsync(Guid id);
    Task<IEnumerable<Tenant>> GetAllAsync();
    Task<bool> DeleteAsync(Guid id);
}
