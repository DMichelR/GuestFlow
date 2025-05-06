// Api.Infrastructure/Services/UserService.cs
using Api.Application.DTOs.User;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.UserRelated;
using Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Api.Application.Interfaces;

namespace Api.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ITenantService _tenantService;

    public UserService(
        IApplicationDbContext dbContext,
        ITenantService tenantService)
    {
        _dbContext = dbContext;
        _tenantService = tenantService;
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
        var tenantId = _tenantService.GetCurrentTenantId();

        var users = await _dbContext.Users
            .Where(u => u.TenantId == tenantId)
            .Include(u => u.Tenant)
            .ToListAsync();

        return users.Select(MapToDto);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        if (await _dbContext.Users.AnyAsync(u => u.Email == dto.Email && u.TenantId == dto.TenantId))
        {
            throw new InvalidOperationException("Email is already in use");
        }
        
        var tenant = await _dbContext.Tenants.FindAsync(dto.TenantId);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }

        var user = new User
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            TenantId = dto.TenantId,
            Tenant = tenant,
            AccessLevel = dto.AccessLevel
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(user.Id);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _dbContext.Users.FindAsync(id);
        if (user == null) return null!;

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

        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<UserDto?> GetByEmailAsync(string email)
    {
        var user = await _dbContext.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == email);

        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto?> GetFromClerkAsync(string email)
    {
        var user = await _dbContext.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == email);

        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto> CreateFromClerkAsync(string clerkUserId, string email, string firstName, string lastName)
    {
        // Validate email uniqueness
        if (await _dbContext.Users.AnyAsync(u => u.Email == email))
        {
            throw new InvalidOperationException("Email is already in use");
        }

        var currentTenantId = _tenantService.GetCurrentTenantId();
        // Handle nullable Guid
        var tenantId = currentTenantId ?? throw new InvalidOperationException("No tenant context available");
    
        var tenant = await _dbContext.Tenants.FindAsync(tenantId);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }

        var newUser = new User
        {
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            Phone = string.Empty,
            TenantId = tenantId,
            Tenant = tenant,
            AccessLevel = AccessLevel.Staff
        };

        _dbContext.Users.Add(newUser);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(newUser.Id);
    }

    private UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.Phone,
            TenantId = user.TenantId,
            TenantName = user.Tenant?.Name ?? string.Empty,
            AccessLevel = user.AccessLevel,
            Created = user.Created,
            Updated = user.Updated
        };
    }
}
