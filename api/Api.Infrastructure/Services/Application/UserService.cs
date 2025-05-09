// Api.Infrastructure/Services/UserService.cs
using Api.Application.DTOs.User;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Api.Application.Interfaces;
using Clerk.BackendAPI;
using Microsoft.Extensions.Logging;
using DomainUser = Api.Domain.Entities.Concretes.UserRelated.User;

namespace Api.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ITenantService _tenantService;
    private readonly IJwtContextService _jwtContextService;
    private readonly ClerkBackendApi _clerkApi;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IApplicationDbContext dbContext,
        ITenantService tenantService,
        IJwtContextService jwtContextService,
        ClerkBackendApi clerkApi,
        ILogger<UserService> logger)
    {
        _dbContext = dbContext;
        _tenantService = tenantService;
        _jwtContextService = jwtContextService;
        _clerkApi = clerkApi;
        _logger = logger;
    }

    public async Task<UserDto> GetByIdAsync(Guid id)
    {
        var user = await _dbContext.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == id);

        return user != null ? MapToDto(user) : null!;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<UserDto>();
        }
        
        var query = _dbContext.Users.AsQueryable();
        
        query = query.Where(u => u.TenantId == tenantId.Value);
        
        var users = await query
            .Include(u => u.Tenant)
            .ToListAsync();

        return users.Select(MapToDto);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto, string clerkId)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }

        if (await _dbContext.Users.AnyAsync(u => u.Email == dto.Email && u.TenantId == tenantId.Value))
        {
            throw new InvalidOperationException("Email is already in use");
        }

        var tenant = await _dbContext.Tenants.FindAsync(tenantId.Value);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }

        // Usar el ClerkId proporcionado directamente
        if (string.IsNullOrEmpty(clerkId))
        {
            throw new InvalidOperationException("ClerkId is required");
        }

        var user = new DomainUser
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            TenantId = tenantId.Value,
            Tenant = tenant,
            AccessLevel = dto.AccessLevel,
            ClerkId = clerkId
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(user.Id);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _dbContext.Users.FindAsync(id);
        if (user == null) return null!;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || user.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Update properties if provided
        if (!string.IsNullOrEmpty(dto.FirstName))
            user.FirstName = dto.FirstName;

        if (!string.IsNullOrEmpty(dto.LastName))
            user.LastName = dto.LastName;

        if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
        {
            // Check email uniqueness
            if (await _dbContext.Users.AnyAsync(u => u.Email == dto.Email && u.TenantId == user.TenantId && u.Id != id))
            {
                throw new InvalidOperationException("Email is already in use");
            }
            user.Email = dto.Email;
        }

        if (!string.IsNullOrEmpty(dto.Phone))
            user.Phone = dto.Phone;

        if (dto.AccessLevel.HasValue)
            user.AccessLevel = dto.AccessLevel.Value;

        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var user = await _dbContext.Users.FindAsync(id);
        if (user == null) return false;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || user.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<UserDto?> GetByEmailAsync(string email)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return null;
        }

        var user = await _dbContext.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == email && u.TenantId == tenantId.Value);

        return user != null ? MapToDto(user) : null;
    }

    private UserDto MapToDto(DomainUser user)
    {
        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.Phone,
            ClerkId = user.ClerkId,
            TenantId = user.TenantId,
            TenantName = user.Tenant?.Name ?? string.Empty,
            AccessLevel = user.AccessLevel,
            Created = user.Created,
            Updated = user.Updated
        };
    }
}
