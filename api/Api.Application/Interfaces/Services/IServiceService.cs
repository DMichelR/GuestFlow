// Api.Application/Interfaces/Services/IServiceService.cs
using Api.Application.DTOs.Service;

namespace Api.Application.Interfaces.Services;

public interface IServiceService
{
    Task<ServiceDto> GetByIdAsync(Guid id);
    Task<IEnumerable<ServiceDto>> GetAllAsync();
    Task<ServiceDto> CreateAsync(CreateServiceDto dto);
    Task<ServiceDto> UpdateAsync(Guid id, UpdateServiceDto dto);
    Task<bool> DeleteAsync(Guid id);
}
