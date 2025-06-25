using Api.Application.DTOs.User;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.UserRelated;
using Api.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application.Examples;

/// <summary>
/// Ejemplo de uso de la funcionalidad IgnoreIsActiveFilter
/// </summary>
public class IsActiveFilterExampleService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<UserService> _logger;

    public IsActiveFilterExampleService(
        IApplicationDbContext dbContext,
        IJwtContextService jwtContextService,
        ILogger<UserService> logger)
    {
        _dbContext = dbContext;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    /// <summary>
    /// Ejemplo: Obtener todos los usuarios, tanto activos como inactivos
    /// </summary>
    public async Task<IEnumerable<UserDto>> GetAllUsersIncludingInactiveAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<UserDto>();
        }
        
        // Utilizamos IncludeInactive para obtener también los usuarios inactivos
        var users = await _dbContext.Users.IncludeInactive()
            // Pero mantenemos el filtrado por tenant
            .Where(u => u.TenantId == tenantId.Value)
            .Include(u => u.Tenant)
            .ToListAsync();
            
        // Mapeo a DTO
        return users.Select(user => new UserDto
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
            IsActive = user.IsActive,
            EmergencyContactName = user.EmergencyContactName,
            EmergencyContactPhone = user.EmergencyContactPhone,
            Address = user.Address,
            BirthDate = user.BirthDate,
            HireDate = user.HireDate,
            GovernmentId = user.GovernmentId,
            DocumentExpiry = user.DocumentExpiry,
            Created = user.Created,
            Updated = user.Updated
        });
    }
    
    /// <summary>
    /// Ejemplo: Obtener solo los usuarios inactivos
    /// </summary>
    public async Task<IEnumerable<UserDto>> GetOnlyInactiveUsersAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<UserDto>();
        }
        
        // Utilizamos IncludeInactive para incluir inactivos y luego filtramos solo por inactivos
        var users = await _dbContext.Users.IncludeInactive()
            .Where(u => u.TenantId == tenantId.Value && !u.IsActive)
            .Include(u => u.Tenant)
            .ToListAsync();
            
        // Mapeo a DTO
        return users.Select(user => new UserDto
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
            IsActive = user.IsActive,
            EmergencyContactName = user.EmergencyContactName,
            EmergencyContactPhone = user.EmergencyContactPhone,
            Address = user.Address,
            BirthDate = user.BirthDate,
            HireDate = user.HireDate,
            GovernmentId = user.GovernmentId,
            DocumentExpiry = user.DocumentExpiry,
            Created = user.Created,
            Updated = user.Updated
        });
    }
    
    /// <summary>
    /// Ejemplo: Restaurar un usuario inactivo (deshacer el borrado lógico)
    /// </summary>
    public async Task<UserDto?> RestoreInactiveUserAsync(Guid userId)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return null;
        }
        
        // Buscar el usuario inactivo (que normalmente no aparecería en las consultas)
        var user = await _dbContext.Users.IncludeInactive()
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);
            
        if (user == null)
        {
            return null;
        }
        
        // Restaurar el usuario (marcándolo como activo)
        user.IsActive = true;
        await (_dbContext as DbContext)!.SaveChangesAsync();
        
        // Devolver el usuario restaurado
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
            IsActive = user.IsActive,
            EmergencyContactName = user.EmergencyContactName,
            EmergencyContactPhone = user.EmergencyContactPhone,
            Address = user.Address,
            BirthDate = user.BirthDate,
            HireDate = user.HireDate,
            GovernmentId = user.GovernmentId,
            DocumentExpiry = user.DocumentExpiry,
            Created = user.Created,
            Updated = user.Updated
        };
    }
}
