// Api.Infrastructure/Services/Application/RoomTypeService.cs
using Api.Application.DTOs.Room;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.RoomRelated;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class RoomTypeService : IRoomTypeService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<RoomTypeService> _logger;

    public RoomTypeService(
        IApplicationDbContext dbContext,
        IJwtContextService jwtContextService,
        ILogger<RoomTypeService> logger)
    {
        _dbContext = dbContext;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    public async Task<RoomTypeDto> GetByIdAsync(Guid id)
    {
        var roomType = await _dbContext.RoomTypes
            .Include(rt => rt.Tenant)
            .FirstOrDefaultAsync(rt => rt.Id == id);
            
        return roomType != null ? MapToDto(roomType) : null!;
    }

    public async Task<IEnumerable<RoomTypeDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<RoomTypeDto>();
        }
        
        var roomTypes = await _dbContext.RoomTypes
            .Include(rt => rt.Tenant)
            .Where(rt => rt.TenantId == tenantId.Value)
            .ToListAsync();
            
        return roomTypes.Select(MapToDto);
    }

    public async Task<RoomTypeDto> CreateAsync(CreateRoomTypeDto dto)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }

        // Verificar que el nombre no esté duplicado para este tenant
        if (await _dbContext.RoomTypes.AnyAsync(rt => rt.Name == dto.Name && rt.TenantId == tenantId.Value))
        {
            throw new InvalidOperationException($"Room type with name {dto.Name} already exists");
        }

        var tenant = await _dbContext.Tenants.FindAsync(tenantId.Value);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }

        var roomType = new RoomType
        {
            Name = dto.Name,
            Price = dto.Price,
            TenantId = tenantId.Value,
            Tenant = tenant
        };

        await _dbContext.RoomTypes.AddAsync(roomType);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(roomType.Id);
    }

    public async Task<RoomTypeDto> UpdateAsync(Guid id, UpdateRoomTypeDto dto)
    {
        var roomType = await _dbContext.RoomTypes.FindAsync(id);
        if (roomType == null) return null!;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || roomType.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Actualizar propiedades si se proporcionaron
        if (!string.IsNullOrEmpty(dto.Name) && dto.Name != roomType.Name)
        {
            // Verificar que el nuevo nombre no esté duplicado
            if (await _dbContext.RoomTypes.AnyAsync(rt => rt.Name == dto.Name && rt.TenantId == tenantId.Value && rt.Id != id))
            {
                throw new InvalidOperationException($"Room type with name {dto.Name} already exists");
            }
            roomType.Name = dto.Name;
        }

        if (dto.Price.HasValue)
        {
            roomType.Price = dto.Price.Value;
        }

        _dbContext.RoomTypes.Update(roomType);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var roomType = await _dbContext.RoomTypes.FindAsync(id);
        
        if (roomType == null) return false;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || roomType.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT when deleting room type");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Verificar si el tipo de habitación está en uso (tiene habitaciones asociadas)
        var inUse = await _dbContext.Rooms.AnyAsync(r => r.RoomTypeId == id);
        if (inUse)
        {
            throw new InvalidOperationException("Cannot delete room type that is in use");
        }

        _dbContext.RoomTypes.Remove(roomType);
        var result = await _dbContext.SaveChangesAsync();
        return result > 0;
    }

    private RoomTypeDto MapToDto(RoomType roomType)
    {
        return new RoomTypeDto
        {
            Id = roomType.Id,
            Name = roomType.Name,
            Price = roomType.Price,
            TenantId = roomType.TenantId,
            TenantName = roomType.Tenant?.Name ?? string.Empty,
            Created = roomType.Created,
            Updated = roomType.Updated
        };
    }
}
