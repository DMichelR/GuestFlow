using Api.Application.DTOs.Guest;

namespace Api.Application.Interfaces.Services;

public interface IGuestService
{
    Task<GuestDto> GetByIdAsync(Guid id);
    Task<IEnumerable<GuestDto>> GetAllAsync();
    Task<GuestDto> CreateAsync(CreateGuestDto dto);
    Task<GuestDto> UpdateAsync(Guid id, UpdateGuestDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<GuestDto?> GetByCidAsync(string cid);
    Task<IEnumerable<GuestDto>> SearchAsync(string term);
}
