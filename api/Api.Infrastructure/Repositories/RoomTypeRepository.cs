// Api.Infrastructure/Repositories/RoomTypeRepository.cs
using Api.Application.Interfaces.Repositories;
using Api.Domain.Entities.Concretes.RoomRelated;
using Api.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Repositories;

public class RoomTypeRepository : IRoomTypeRepository
{
    private readonly ApplicationDbContext _context;

    public RoomTypeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RoomType> CreateAsync(RoomType roomType)
    {
        await _context.RoomTypes.AddAsync(roomType);
        await _context.SaveChangesAsync();
        return roomType;
    }

    public async Task<bool> UpdateAsync(RoomType roomType)
    {
        _context.RoomTypes.Update(roomType);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task<RoomType?> GetByIdAsync(Guid id)
    {
        return await _context.RoomTypes
            .Include(rt => rt.Tenant)
            .FirstOrDefaultAsync(rt => rt.Id == id);
    }

    public async Task<IEnumerable<RoomType>> GetAllAsync()
    {
        return await _context.RoomTypes
            .Include(rt => rt.Tenant)
            .ToListAsync();
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var roomType = await _context.RoomTypes.FindAsync(id);
        if (roomType == null) return false;

        _context.RoomTypes.Remove(roomType);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }
}
