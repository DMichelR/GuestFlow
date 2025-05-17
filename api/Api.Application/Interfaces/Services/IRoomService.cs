// Api.Application/Interfaces/Services/IRoomService.cs
using Api.Application.DTOs.Room;

namespace Api.Application.Interfaces.Services;

public interface IRoomService
{
    Task<RoomDto> GetByIdAsync(Guid id);
    Task<IEnumerable<RoomDto>> GetAllAsync();
    Task<RoomDto> CreateAsync(CreateRoomDto dto);
    Task<RoomDto> UpdateAsync(Guid id, UpdateRoomDto dto);
    Task<bool> DeleteAsync(Guid id);
}
