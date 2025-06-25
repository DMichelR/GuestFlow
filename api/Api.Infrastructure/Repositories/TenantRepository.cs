using Api.Application.Interfaces.Repositories;
using Api.Domain.Entities;
using Api.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Repositories;

public class TenantRepository : ITenantRepository
{
    private readonly ApplicationDbContext _context;

    public TenantRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Tenant> CreateAsync(Tenant tenant)
    {
        await _context.Tenants.AddAsync(tenant);
        await _context.SaveChangesAsync();
        return tenant;
    }

    public async Task<bool> UpdateAsync(Tenant tenant)
    {
        _context.Tenants.Update(tenant);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task<Tenant?> GetByIdAsync(Guid id)
    {
        return await _context.Tenants
            .Include(t => t.Country)
            .Include(t => t.City)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<Tenant>> GetAllAsync()
    {
        return await _context.Tenants
            .Include(t => t.Country)
            .Include(t => t.City)
            .ToListAsync();
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return false;

        // Soft delete: set IsActive to false instead of removing the record
        tenant.IsActive = false;
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }
}
