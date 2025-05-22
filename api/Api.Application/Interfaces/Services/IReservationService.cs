// Api.Application/Interfaces/Services/IReservationService.cs
using Api.Application.DTOs.Stay;

namespace Api.Application.Interfaces.Services;

public interface IReservationService
{
    Task<ReservationDto> GetByIdAsync(Guid id);
    Task<IEnumerable<ReservationDto>> GetAllAsync();
    Task<ReservationDto> CreateAsync(CreateReservationDto dto);
    Task<ReservationDto> UpdateAsync(Guid id, UpdateReservationDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> AddGuestAsync(Guid reservationId, Guid guestId);
    Task<bool> RemoveGuestAsync(Guid reservationId, Guid guestId);
    Task<bool> AddRoomAsync(Guid reservationId, Guid roomId);
    Task<bool> RemoveRoomAsync(Guid reservationId, Guid roomId);
    Task<bool> ChangeStateAsync(Guid reservationId, string state);
}
