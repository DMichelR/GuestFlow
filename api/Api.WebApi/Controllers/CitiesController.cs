using Api.Application.DTOs.City;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CitiesController : ControllerBase
{
    private readonly ICityService _cityService;
    private readonly ILogger<CitiesController> _logger;

    public CitiesController(ICityService cityService, ILogger<CitiesController> logger)
    {
        _cityService = cityService;
        _logger = logger;
    }

    // GET: api/cities
    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<CityDto>>> GetAll()
    {
        try
        {
            var cities = await _cityService.GetAllAsync();
            return Ok(cities);
                
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cities");
            return StatusCode(500, new { message = "Error retrieving cities" });
        }
    }

    // GET: api/cities/{id}
    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<CityDto>> GetById(Guid id)
    {
        try
        {
            var city = await _cityService.GetByIdAsync(id);
            if (city == null) return NotFound(new { message = $"City with ID {id} not found" });
            return Ok(city);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving city with ID {Id}", id);
            return StatusCode(500, new { message = $"Error retrieving city with ID {id}" });
        }
    }
}
