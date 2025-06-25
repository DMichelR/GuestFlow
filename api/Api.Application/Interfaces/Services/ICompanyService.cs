using Api.Application.DTOs.Company;

namespace Api.Application.Interfaces.Services;

public interface ICompanyService
{
    Task<CompanyDto> GetByIdAsync(Guid id);
    Task<IEnumerable<CompanyDto>> GetAllAsync();
    Task<CompanyDto> CreateAsync(CreateCompanyDto dto);
    Task<CompanyDto> UpdateAsync(Guid id, UpdateCompanyDto dto);
    Task<bool> DeleteAsync(Guid id);
}
