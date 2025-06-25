using Api.Application.DTOs.Country;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CountriesController : ControllerBase
{
    private readonly ICountryService _countryService;
    private readonly ILogger<CountriesController> _logger;

    public CountriesController(ICountryService countryService, ILogger<CountriesController> logger)
    {
        _countryService = countryService;
        _logger = logger;
    }

    // GET: api/countries
    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<CountryDto>>> GetAll()
    {
        try
        {
            var countries = await _countryService.GetAllAsync();
            return Ok(countries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all countries");
            return StatusCode(500, new { message = "Error retrieving countries" });
        }
    }

    // GET: api/countries/{id}
    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<CountryDto>> GetById(Guid id)
    {
        try
        {
            var country = await _countryService.GetByIdAsync(id);
            if (country == null) return NotFound(new { message = $"Country with ID {id} not found" });
            return Ok(country);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving country with ID {Id}", id);
            return StatusCode(500, new { message = $"Error retrieving country with ID {id}" });
        }
    }
    
    // POST: api/countries
    [HttpPost]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<CountryDto>> Create([FromBody] CreateCountryDto createCountryDto)
    {
        try
        {
            var country = await _countryService.CreateAsync(createCountryDto);
            return CreatedAtAction(nameof(GetById), new { id = country.Id }, country);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating country");
            return StatusCode(500, new { message = "Error creating country" });
        }
    }
}
