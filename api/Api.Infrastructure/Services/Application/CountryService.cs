using Api.Application.DTOs.Country;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.GuestRelated;
using Api.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class CountryService : ICountryService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CountryService> _logger;

    public CountryService(ApplicationDbContext context, ILogger<CountryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CountryDto> GetByIdAsync(Guid id)
    {
        var country = await _context.Set<Country>()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (country == null)
            return null!;

        return new CountryDto
        {
            Id = country.Id,
            Name = country.Name
        };
    }

    public async Task<IEnumerable<CountryDto>> GetAllAsync()
    {
        try
        {
            var countries = await _context.Set<Country>()
                .OrderBy(c => c.Name)
                .ToListAsync();

            return countries.Select(c => new CountryDto
            {
                Id = c.Id,
                Name = c.Name
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all countries");
            throw;
        }
    }
}
