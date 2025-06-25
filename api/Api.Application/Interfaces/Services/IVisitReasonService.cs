// Api.Application/Interfaces/Services/IVisitReasonService.cs

using Api.Application.DTOs.VisitReason;

namespace Api.Application.Interfaces.Services;

public interface IVisitReasonService
{
    Task<VisitReasonDto> GetByIdAsync(Guid id);
    Task<IEnumerable<VisitReasonDto>> GetAllAsync();
    Task<VisitReasonDto> CreateAsync(CreateVisitReasonDto dto);
    Task<VisitReasonDto> UpdateAsync(Guid id, UpdateVisitReasonDto dto);
    Task<bool> DeleteAsync(Guid id);
}
