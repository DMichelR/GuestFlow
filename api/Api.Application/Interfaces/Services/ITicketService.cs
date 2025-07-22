

using Api.Application.DTOs.Service;

namespace Api.Application.Interfaces.Services;

public interface ITicketService
{
    Task<TicketDto> GetByIdAsync(Guid id);
    Task<IEnumerable<TicketDto>> GetAllAsync();
    Task<IEnumerable<TicketDto>> GetByStayIdAsync(Guid stayId);
    Task<TicketDto> CreateAsync(CreateTicketDto ticket);
    Task<TicketDto> UpdateAsync(Guid id, UpdateTicketDto ticket);
    Task<bool> DeleteAsync(Guid id);
}
