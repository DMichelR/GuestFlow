// Api.Application/Interfaces/Services/IGroupGuestsService.cs
using Api.Domain.Entities.Concretes.StayRelated;

namespace Api.Application.Interfaces.Services;

public interface IGroupGuestsService
{
    Task<bool> AddGuestToStayAsync(Guid stayId, Guid guestId);
    Task<bool> RemoveGuestFromStayAsync(Guid stayId, Guid guestId);
    Task<IEnumerable<GroupGuests>> GetGuestsByStayIdAsync(Guid stayId);
    Task<bool> AddGuestsToStayAsync(Guid stayId, IEnumerable<Guid> guestIds);
    Task<bool> UpdateGuestsForStayAsync(Guid stayId, IEnumerable<Guid> newGuestIds);
}
