using Api.Application.DTOs.City;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Api.Application.Interfaces.Services;

public interface ICityService
{
    Task<CityDto> GetByIdAsync(Guid id);
    Task<IEnumerable<CityDto>> GetAllAsync();
    Task<IEnumerable<CityDto>> GetByCountryIdAsync();
}
