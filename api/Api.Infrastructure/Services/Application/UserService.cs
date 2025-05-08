// Api.Infrastructure/Services/UserService.cs
using Api.Application.DTOs.User;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Api.Application.Interfaces;
using Clerk.BackendAPI;
using DomainUser = Api.Domain.Entities.Concretes.UserRelated.User;

namespace Api.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ITenantService _tenantService;
    private readonly ClerkBackendApi _clerkApi;

    public UserService(
        IApplicationDbContext dbContext,
        ITenantService tenantService,
        ClerkBackendApi clerkApi)
    {
        _dbContext = dbContext;
        _tenantService = tenantService;
        _clerkApi = clerkApi;
    }

    public async Task<UserDto> GetByIdAsync(Guid id)
    {
        var user = await _dbContext.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == id);

        return user != null ? MapToDto(user) : null!;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync(Guid tenantId)
    {
        var query = _dbContext.Users.AsQueryable();
        
        query = query.Where(u => u.TenantId == tenantId);
        
        var users = await query
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

        try
        {
            
            var clerkResponse = await _clerkApi.Users.GetAsync(dto.Email);
            var clerkUser = clerkResponse.User; // Extraer el usuario desde la respuesta
            
            if (clerkUser == null)
            {
                throw new InvalidOperationException("Failed to create user in Clerk authentication service");
            }

            var user = new DomainUser
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                TenantId = dto.TenantId,
                Tenant = tenant,
                AccessLevel = dto.AccessLevel,
                ClerkId = clerkUser.Id
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            return await GetByIdAsync(user.Id);
        }
        catch (Clerk.BackendAPI.Models.Errors.ClerkErrors clerkEx)
        {
            // Extract the detailed error information from the Clerk exception
            var errorDetails = clerkEx.ToString();
            Console.WriteLine($"Clerk API Error: {errorDetails}");
            
            // Check if the error message contains information about validation errors
            if (errorDetails.Contains("email_address"))
            {
                throw new InvalidOperationException("Invalid email format or the email is already registered in Clerk", clerkEx);
            }
            else if (errorDetails.Contains("password"))
            {
                throw new InvalidOperationException("Password does not meet requirements", clerkEx);
            }
            else
            {
                throw new InvalidOperationException($"Error creating user in authentication service: {errorDetails}", clerkEx);
            }
        }
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
