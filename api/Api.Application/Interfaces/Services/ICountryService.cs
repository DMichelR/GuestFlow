using Api.Application.DTOs.Country;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Api.Application.Interfaces.Services;

public interface ICountryService
{
    Task<CountryDto> GetByIdAsync(Guid id);
    Task<IEnumerable<CountryDto>> GetAllAsync();
}
