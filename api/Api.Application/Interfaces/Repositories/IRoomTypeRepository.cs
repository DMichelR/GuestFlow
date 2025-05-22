// Api.Application/Interfaces/Repositories/IRoomTypeRepository.cs
using Api.Domain.Entities.Concretes.RoomRelated;

namespace Api.Application.Interfaces.Repositories;

public interface IRoomTypeRepository
{
    Task<RoomType> CreateAsync(RoomType roomType);
    Task<bool> UpdateAsync(RoomType roomType);
    Task<RoomType?> GetByIdAsync(Guid id);
    Task<IEnumerable<RoomType>> GetAllAsync();
    Task<bool> DeleteAsync(Guid id);
}
