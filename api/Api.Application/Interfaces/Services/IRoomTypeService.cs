// Api.Application/Interfaces/Services/IRoomTypeService.cs
using Api.Application.DTOs.Room;

namespace Api.Application.Interfaces.Services;

public interface IRoomTypeService
{
    Task<RoomTypeDto> GetByIdAsync(Guid id);
    Task<IEnumerable<RoomTypeDto>> GetAllAsync();
    Task<RoomTypeDto> CreateAsync(CreateRoomTypeDto dto);
    Task<RoomTypeDto> UpdateAsync(Guid id, UpdateRoomTypeDto dto);
    Task<bool> DeleteAsync(Guid id);
}
