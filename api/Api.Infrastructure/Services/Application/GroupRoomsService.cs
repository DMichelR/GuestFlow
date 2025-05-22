// Api.Infrastructure/Services/Application/GroupRoomsService.cs
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.StayRelated;
using Api.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class GroupRoomsService : IGroupRoomsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<GroupRoomsService> _logger;

    public GroupRoomsService(
        ApplicationDbContext context,
        ILogger<GroupRoomsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> AddRoomToStayAsync(Guid stayId, Guid roomId)
    {
        try
        {
            // Check if the association already exists
            var exists = await _context.GroupRooms
                .AnyAsync(gr => gr.StayId == stayId && gr.RoomId == roomId);
                
            if (exists)
            {
                _logger.LogWarning("Room {RoomId} is already associated with stay {StayId}", roomId, stayId);
                return true; // Already exists, so technically successful
            }

            // Get the stay and room to ensure they exist
            var stay = await _context.Stays.FindAsync(stayId);
            if (stay == null)
            {
                _logger.LogError("Failed to add room to stay: Stay {StayId} not found", stayId);
                return false;
            }
            
            var room = await _context.Rooms.FindAsync(roomId);
            if (room == null)
            {
                _logger.LogError("Failed to add room to stay: Room {RoomId} not found", roomId);
                return false;
            }
            
            var groupRoom = new GroupRooms
            {
                StayId = stayId,
                RoomId = roomId,
                Stay = stay,
                Room = room,
                Tenant = stay.Tenant,
                TenantId = stay.TenantId
            };
            
            await _context.GroupRooms.AddAsync(groupRoom);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding room {RoomId} to stay {StayId}", roomId, stayId);
            return false;
        }
    }

    public async Task<bool> RemoveRoomFromStayAsync(Guid stayId, Guid roomId)
    {
        try
        {
            var groupRoom = await _context.GroupRooms
                .FirstOrDefaultAsync(gr => gr.StayId == stayId && gr.RoomId == roomId);
                
            if (groupRoom == null)
            {
                _logger.LogWarning("Room {RoomId} is not associated with stay {StayId}", roomId, stayId);
                return false;
            }
            
            _context.GroupRooms.Remove(groupRoom);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing room {RoomId} from stay {StayId}", roomId, stayId);
            return false;
        }
    }

    public async Task<IEnumerable<GroupRooms>> GetRoomsByStayIdAsync(Guid stayId)
    {
        try
        {
            return await _context.GroupRooms
                .Include(gr => gr.Room)
                .Where(gr => gr.StayId == stayId)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving rooms for stay {StayId}", stayId);
            return Enumerable.Empty<GroupRooms>();
        }
    }

    public async Task<bool> AddRoomsToStayAsync(Guid stayId, IEnumerable<Guid> roomIds)
    {
        try
        {
            // Check if the stay exists
            var stay = await _context.Stays.FindAsync(stayId);
            if (stay == null)
            {
                _logger.LogError("Failed to add rooms to stay: Stay {StayId} not found", stayId);
                return false;
            }
            
            // Filter out already associated rooms
            var existingRoomIds = await _context.GroupRooms
                .Where(gr => gr.StayId == stayId)
                .Select(gr => gr.RoomId)
                .ToListAsync();
                
            var newRoomIds = roomIds.Except(existingRoomIds).ToList();
            
            // Get all rooms at once to verify they exist
            var rooms = await _context.Rooms
                .Where(r => newRoomIds.Contains(r.Id))
                .ToDictionaryAsync(r => r.Id, r => r);
            
            foreach (var roomId in newRoomIds)
            {
                if (!rooms.TryGetValue(roomId, out var room))
                {
                    _logger.LogWarning("Room {RoomId} not found, skipping", roomId);
                    continue;
                }
                
                var groupRoom = new GroupRooms
                {
                    StayId = stayId,
                    RoomId = roomId,
                    Stay = stay,
                    Room = room,
                    Tenant = stay.Tenant,
                    TenantId = stay.TenantId
                };
                
                await _context.GroupRooms.AddAsync(groupRoom);
            }
            
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding rooms to stay {StayId}", stayId);
            return false;
        }
    }

    public async Task<bool> UpdateRoomsForStayAsync(Guid stayId, IEnumerable<Guid> newRoomIds)
    {
        try
        {
            // Get current rooms
            var currentRoomAssociations = await _context.GroupRooms
                .Where(gr => gr.StayId == stayId)
                .ToListAsync();
            
            var currentRoomIds = currentRoomAssociations.Select(gr => gr.RoomId).ToList();
            var newRoomIdsList = newRoomIds.ToList();
            
            // Remove rooms that are no longer in the list
            var roomsToRemove = currentRoomAssociations
                .Where(gr => !newRoomIdsList.Contains(gr.RoomId))
                .ToList();
                
            foreach (var groupRoom in roomsToRemove)
            {
                _context.GroupRooms.Remove(groupRoom);
            }
            
            // Add new rooms
            var roomIdsToAdd = newRoomIdsList.Except(currentRoomIds).ToList();
            
            if (roomIdsToAdd.Any())
            {
                await AddRoomsToStayAsync(stayId, roomIdsToAdd);
            }
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rooms for stay {StayId}", stayId);
            return false;
        }
    }
}
