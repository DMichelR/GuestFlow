using Api.Application.DTOs.Profession;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Api.Application.Interfaces.Services;

public interface IProfessionService
{
    Task<ProfessionDto> GetByIdAsync(Guid id);
    Task<IEnumerable<ProfessionDto>> GetAllAsync();
}
