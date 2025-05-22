// Api.Application/Interfaces/Services/IGroupRoomsService.cs
using Api.Domain.Entities.Concretes.StayRelated;

namespace Api.Application.Interfaces.Services;

public interface IGroupRoomsService
{
    Task<bool> AddRoomToStayAsync(Guid stayId, Guid roomId);
    Task<bool> RemoveRoomFromStayAsync(Guid stayId, Guid roomId);
    Task<IEnumerable<GroupRooms>> GetRoomsByStayIdAsync(Guid stayId);
    Task<bool> AddRoomsToStayAsync(Guid stayId, IEnumerable<Guid> roomIds);
    Task<bool> UpdateRoomsForStayAsync(Guid stayId, IEnumerable<Guid> newRoomIds);
}
