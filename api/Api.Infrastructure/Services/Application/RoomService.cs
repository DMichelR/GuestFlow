// Api.Infrastructure/Services/Application/RoomService.cs
using Api.Application.DTOs.Room;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.RoomRelated;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class RoomService : IRoomService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<RoomService> _logger;

    public RoomService(
        IApplicationDbContext dbContext,
        IJwtContextService jwtContextService,
        ILogger<RoomService> logger)
    {
        _dbContext = dbContext;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    public async Task<RoomDto> GetByIdAsync(Guid id)
    {
        var room = await _dbContext.Rooms
            .Include(r => r.RoomType)
            .Include(r => r.Tenant)
            .FirstOrDefaultAsync(r => r.Id == id);
            
        return room != null ? MapToDto(room) : null!;
    }

    public async Task<IEnumerable<RoomDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<RoomDto>();
        }
        
        var rooms = await _dbContext.Rooms
            .Include(r => r.RoomType)
            .Include(r => r.Tenant)
            .Where(r => r.TenantId == tenantId.Value)
            .ToListAsync();
            
        return rooms.Select(MapToDto);
    }

    public async Task<RoomDto> CreateAsync(CreateRoomDto dto)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }

        // Verificar que el RoomType existe
        var roomType = await _dbContext.RoomTypes.FindAsync(dto.RoomTypeId);
        if (roomType == null)
        {
            throw new InvalidOperationException($"RoomType with ID {dto.RoomTypeId} not found");
        }

        // Verificar que el número de habitación no esté duplicado para este tenant
        if (await _dbContext.Rooms.AnyAsync(r => r.Number == dto.Number && r.TenantId == tenantId.Value))
        {
            throw new InvalidOperationException($"Room with number {dto.Number} already exists");
        }

        var tenant = await _dbContext.Tenants.FindAsync(tenantId.Value);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }

        var room = new Room
        {
            Number = dto.Number,
            RoomTypeId = dto.RoomTypeId,
            Status = dto.Status,
            TenantId = tenantId.Value,
            RoomType = roomType,
            Tenant = tenant
        };

        await _dbContext.Rooms.AddAsync(room);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(room.Id);
    }

    public async Task<RoomDto> UpdateAsync(Guid id, UpdateRoomDto dto)
    {
        var room = await _dbContext.Rooms.FindAsync(id);
        if (room == null) return null!;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || room.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Actualizar propiedades si se proporcionaron
        if (!string.IsNullOrEmpty(dto.Number) && dto.Number != room.Number)
        {
            // Verificar que el nuevo número no esté duplicado
            if (await _dbContext.Rooms.AnyAsync(r => r.Number == dto.Number && r.TenantId == tenantId.Value && r.Id != id))
            {
                throw new InvalidOperationException($"Room with number {dto.Number} already exists");
            }
            room.Number = dto.Number;
        }

        if (dto.RoomTypeId.HasValue && dto.RoomTypeId.Value != room.RoomTypeId)
        {
            // Verificar que el RoomType existe
            var roomType = await _dbContext.RoomTypes.FindAsync(dto.RoomTypeId.Value);
            if (roomType == null)
            {
                throw new InvalidOperationException($"RoomType with ID {dto.RoomTypeId} not found");
            }
            room.RoomTypeId = dto.RoomTypeId.Value;
        }

        if (dto.Status.HasValue)
        {
            room.Status = dto.Status.Value;
        }

        _dbContext.Rooms.Update(room);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var room = await _dbContext.Rooms.FindAsync(id);
        
        if (room == null) return false;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || room.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT when deleting room");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Verificar si la habitación está en uso (tiene relaciones con GroupRooms)
        var inUse = await _dbContext.GroupRooms.AnyAsync(gr => gr.RoomId == id);
        if (inUse)
        {
            throw new InvalidOperationException("Cannot delete room that is in use");
        }

        _dbContext.Rooms.Remove(room);
        var result = await _dbContext.SaveChangesAsync();
        return result > 0;
    }

    private RoomDto MapToDto(Room room)
    {
        return new RoomDto
        {
            Id = room.Id,
            Number = room.Number,
            RoomTypeId = room.RoomTypeId,
            RoomTypeName = room.RoomType?.Name ?? string.Empty,
            RoomTypePrice = room.RoomType?.Price ?? 0,
            Status = room.Status,
            TenantId = room.TenantId,
            TenantName = room.Tenant?.Name ?? string.Empty,
            Created = room.Created,
            Updated = room.Updated
        };
    }
}
