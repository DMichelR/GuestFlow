// Api.Application/Interfaces/Repositories/IRoomRepository.cs
using Api.Domain.Entities.Concretes.RoomRelated;

namespace Api.Application.Interfaces.Repositories;

public interface IRoomRepository
{
    Task<Room> CreateAsync(Room room);
    Task<bool> UpdateAsync(Room room);
    Task<Room?> GetByIdAsync(Guid id);
    Task<IEnumerable<Room>> GetAllAsync();
    Task<bool> DeleteAsync(Guid id);
}
