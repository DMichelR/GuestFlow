// Api.WebApi/Controllers/VisitReasonController.cs

using Api.Application.DTOs.VisitReason;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VisitReasonController : ControllerBase
{
    private readonly IVisitReasonService _visitReasonService;
    private readonly ILogger<VisitReasonController> _logger;

    public VisitReasonController(IVisitReasonService visitReasonService, ILogger<VisitReasonController> logger)
    {
        _visitReasonService = visitReasonService;
        _logger = logger;
    }

    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<VisitReasonDto>>> GetAll()
    {
        try
        {
            var visitReasons = await _visitReasonService.GetAllAsync();
            return Ok(visitReasons);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all visit reasons");
            return StatusCode(500, new { message = "Error retrieving visit reasons" });
        }
    }

    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<VisitReasonDto>> GetById(Guid id)
    {
        try
        {
            var visitReason = await _visitReasonService.GetByIdAsync(id);
            if (visitReason == null) return NotFound(new { message = $"Visit reason with ID {id} not found" });
            return Ok(visitReason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving visit reason with ID {Id}", id);
            return StatusCode(500, new { message = $"Error retrieving visit reason with ID {id}" });
        }
    }

    [HttpPost]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<VisitReasonDto>> Create(CreateVisitReasonDto dto)
    {
        try
        {
            var visitReason = await _visitReasonService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = visitReason.Id }, visitReason);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error creating visit reason: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating visit reason");
            return StatusCode(500, new { message = "Error creating visit reason" });
        }
    }

    [HttpPut("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<VisitReasonDto>> Update(Guid id, UpdateVisitReasonDto dto)
    {
        try
        {
            var visitReason = await _visitReasonService.UpdateAsync(id, dto);
            if (visitReason == null) return NotFound(new { message = $"Visit reason with ID {id} not found" });
            return Ok(visitReason);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error updating visit reason with ID {Id}: {Message}", id, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating visit reason with ID {Id}", id);
            return StatusCode(500, new { message = $"Error updating visit reason with ID {id}" });
        }
    }

    [HttpDelete("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _visitReasonService.DeleteAsync(id);
            if (!result) return NotFound(new { message = $"Visit reason with ID {id} not found" });
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error deleting visit reason with ID {Id}: {Message}", id, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting visit reason with ID {Id}", id);
            return StatusCode(500, new { message = $"Error deleting visit reason with ID {id}" });
        }
    }
}