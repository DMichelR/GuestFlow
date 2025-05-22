// Api.Infrastructure/Repositories/RoomRepository.cs
using Api.Application.Interfaces.Repositories;
using Api.Domain.Entities.Concretes.RoomRelated;
using Api.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Repositories;

public class RoomRepository : IRoomRepository
{
    private readonly ApplicationDbContext _context;

    public RoomRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Room> CreateAsync(Room room)
    {
        await _context.Rooms.AddAsync(room);
        await _context.SaveChangesAsync();
        return room;
    }

    public async Task<bool> UpdateAsync(Room room)
    {
        _context.Rooms.Update(room);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task<Room?> GetByIdAsync(Guid id)
    {
        return await _context.Rooms
            .Include(r => r.RoomType)
            .Include(r => r.Tenant)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Room>> GetAllAsync()
    {
        return await _context.Rooms
            .Include(r => r.RoomType)
            .Include(r => r.Tenant)
            .ToListAsync();
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var room = await _context.Rooms.FindAsync(id);
        if (room == null) return false;

        _context.Rooms.Remove(room);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }
}
