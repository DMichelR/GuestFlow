using Api.Application.DTOs.Company;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.GuestRelated;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class CompanyService : ICompanyService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<CompanyService> _logger;
    
    public CompanyService(
        IApplicationDbContext dbContext,
        IJwtContextService jwtContextService,
        ILogger<CompanyService> logger)
    {
        _dbContext = dbContext;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    public async Task<CompanyDto> GetByIdAsync(Guid id)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }
        
        var company = await _dbContext.Companies
            .Include(c => c.Tenant)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId.Value);

        if (company == null)
            return null!;

        return MapToDto(company);
    }

    public async Task<IEnumerable<CompanyDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }
        
        var companies = await _dbContext.Companies
            .Include(c => c.Tenant)
            .Where(c => c.TenantId == tenantId.Value)
            .ToListAsync();

        return companies.Select(MapToDto);
    }

    public async Task<CompanyDto> CreateAsync(CreateCompanyDto dto)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }

        var tenant = await _dbContext.Tenants.FindAsync(tenantId.Value);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }

        // Verificar que no existe otra compañía con el mismo nombre para este tenant
        if (await _dbContext.Companies.AnyAsync(c => c.Name == dto.Name && c.TenantId == tenantId.Value))
        {
            throw new InvalidOperationException($"Company with name '{dto.Name}' already exists for this tenant");
        }

        var company = new Company
        {
            Name = dto.Name,
            TenantId = tenantId.Value,
            Tenant = tenant
        };

        await _dbContext.Companies.AddAsync(company);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(company.Id);
    }

    public async Task<CompanyDto> UpdateAsync(Guid id, UpdateCompanyDto dto)
    {
        var company = await _dbContext.Companies.FindAsync(id);
        if (company == null)
        {
            throw new InvalidOperationException($"Company with ID {id} not found");
        }
        
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || company.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT");
            throw new InvalidOperationException("Unauthorized tenant access");
        }
        
        // Verificar que no existe otra compañía con el mismo nombre para este tenant (excepto esta misma compañía)
        if (await _dbContext.Companies.AnyAsync(c => c.Name == dto.Name && c.TenantId == tenantId.Value && c.Id != id))
        {
            throw new InvalidOperationException($"Another company with name '{dto.Name}' already exists for this tenant");
        }

        company.Name = dto.Name;

        _dbContext.Companies.Update(company);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(company.Id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var company = await _dbContext.Companies.FindAsync(id);
        if (company == null) return false;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || company.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT when deleting company");
            throw new InvalidOperationException("Unauthorized tenant access");
        }
        
        // Verificar si la compañía está relacionada con alguna estancia
        var inUse = await _dbContext.Stays.AnyAsync(s => s.CompanyId == id);
        if (inUse)
        {
            throw new InvalidOperationException("Cannot delete company that is associated with stays");
        }

        // Soft delete: set IsActive to false instead of removing the record
        company.IsActive = false;
        var result = await _dbContext.SaveChangesAsync();
        return result > 0;
    }

    private CompanyDto MapToDto(Company company)
    {
        return new CompanyDto
        {
            Id = company.Id,
            Name = company.Name,
            TenantId = company.TenantId,
            TenantName = company.Tenant?.Name ?? string.Empty,
            Created = company.Created,
            Updated = company.Updated
        };
    }
}
