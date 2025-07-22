using Api.Application.DTOs.Profession;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfessionsController : ControllerBase
{
    private readonly IProfessionService _professionService;
    private readonly ILogger<ProfessionsController> _logger;

    public ProfessionsController(IProfessionService professionService, ILogger<ProfessionsController> logger)
    {
        _professionService = professionService;
        _logger = logger;
    }

    // GET: api/professions
    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<ProfessionDto>>> GetAll()
    {
        try
        {
            var professions = await _professionService.GetAllAsync();
            return Ok(professions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all professions");
            return StatusCode(500, new { message = "Error retrieving professions" });
        }
    }

    // GET: api/professions/{id}
    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<ProfessionDto>> GetById(Guid id)
    {
        try
        {
            var profession = await _professionService.GetByIdAsync(id);
            if (profession == null) return NotFound(new { message = $"Profession with ID {id} not found" });
            return Ok(profession);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving profession with ID {Id}", id);
            return StatusCode(500, new { message = $"Error retrieving profession with ID {id}" });
        }
    }
    
    // POST: api/professions
    [HttpPost]
    [RequireAccessLevel(AccessLevel.Receptionist)]
    public async Task<ActionResult<ProfessionDto>> Create([FromBody] CreateProfessionDto createProfessionDto)
    {
        try
        {
            var profession = await _professionService.CreateAsync(createProfessionDto);
            return CreatedAtAction(nameof(GetById), new { id = profession.Id }, profession);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating profession");
            return StatusCode(500, new { message = "Error creating profession" });
        }
    }
}
