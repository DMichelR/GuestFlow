using Api.Application.DTOs.City;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.GuestRelated;
using Api.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class CityService : ICityService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CityService> _logger;

    public CityService(ApplicationDbContext context, ILogger<CityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CityDto> GetByIdAsync(Guid id)
    {
        var city = await _context.Set<City>()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (city == null)
            return null!;

        return new CityDto
        {
            Id = city.Id,
            Name = city.Name
        };
    }

    public async Task<IEnumerable<CityDto>> GetAllAsync()
    {
        var cities = await _context.Set<City>()
            .OrderBy(c => c.Name)
            .ToListAsync();

        return cities.Select(c => new CityDto
        {
            Id = c.Id,
            Name = c.Name
        }).ToList();
    }

    public async Task<IEnumerable<CityDto>> GetByCountryIdAsync()
    {
        try
        {
            var cities = await _context.Set<City>()
                .OrderBy(c => c.Name)
                .ToListAsync();

            return cities.Select(c => new CityDto
            {
                Id = c.Id,
                Name = c.Name,
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error");
            throw;
        }
    }
    
    public async Task<CityDto> CreateAsync(CreateCityDto createCityDto)
    {
        try
        {
            var city = new City
            {
                Name = createCityDto.Name
            };

            await _context.Set<City>().AddAsync(city);
            await _context.SaveChangesAsync();

            return new CityDto
            {
                Id = city.Id,
                Name = city.Name
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating city");
            throw;
        }
    }
}
