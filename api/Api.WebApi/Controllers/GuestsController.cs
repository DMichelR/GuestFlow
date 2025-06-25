// filepath: /home/mcqueen/Desktop/Code/Proyecto de grado/GuestFlow/api/Api.WebApi/Controllers/GuestsController.cs
using Api.Application.DTOs.Guest;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GuestsController : ControllerBase
{
    private readonly IGuestService _guestService;
    private readonly ILogger<GuestsController> _logger;

    public GuestsController(IGuestService guestService, ILogger<GuestsController> logger)
    {
        _guestService = guestService;
        _logger = logger;
    }

    // GET: api/guests
    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<GuestDto>>> GetAll()
    {
        try
        {
            var guests = await _guestService.GetAllAsync();
            return Ok(guests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all guests");
            return StatusCode(500, new { message = "Error retrieving guests" });
        }
    }

    // GET: api/guests/{id}
    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<GuestDto>> GetById(Guid id)
    {
        try
        {
            var guest = await _guestService.GetByIdAsync(id);
            if (guest == null) return NotFound(new { message = $"Guest with ID {id} not found" });
            return Ok(guest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving guest with ID {Id}", id);
            return StatusCode(500, new { message = $"Error retrieving guest with ID {id}" });
        }
    }

    // GET: api/guests/byCid/{cid}
    [HttpGet("byCid/{cid}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<GuestDto>> GetByCid(string cid)
    {
        try
        {
            var guest = await _guestService.GetByCidAsync(cid);
            if (guest == null) return NotFound(new { message = $"Guest with CID {cid} not found" });
            return Ok(guest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving guest with CID {Cid}", cid);
            return StatusCode(500, new { message = $"Error retrieving guest with CID {cid}" });
        }
    }

    // GET: api/guests/search/{term}
    [HttpGet("search/{term}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<GuestDto>>> Search(string term)
    {
        try
        {
            var guests = await _guestService.SearchAsync(term);
            return Ok(guests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching guests with term {Term}", term);
            return StatusCode(500, new { message = $"Error searching guests with term {term}" });
        }
    }

    // POST: api/guests
    [HttpPost]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<GuestDto>> Create(CreateGuestDto dto)
    {
        try
        {
            var guest = await _guestService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = guest.Id }, guest);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when creating guest");
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pgEx && 
                                         pgEx.SqlState == "23503") // Foreign key constraint violation
        {
            string constraintName = pgEx.ConstraintName ?? string.Empty;
            string entityName = "a related entity";
            
            if (constraintName.Contains("FK_Guests_Professions"))
                entityName = "the specified profession";
            else if (constraintName.Contains("FK_Guests_Cities"))
                entityName = "the specified city";
            else if (constraintName.Contains("FK_Guests_Countries"))
                entityName = "the specified country";
                
            _logger.LogWarning(ex, "Foreign key constraint violation: {Constraint}", constraintName);
            return BadRequest(new { 
                message = "Error creating guest", 
                details = $"Failed to create guest because {entityName} doesn't exist. Please select valid values."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating guest");
            return StatusCode(500, new { message = "Error creating guest", details = ex.Message });
        }
    }

    // PUT: api/guests/{id}
    [HttpPut("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<GuestDto>> Update(Guid id, UpdateGuestDto dto)
    {
        try
        {
            var guest = await _guestService.UpdateAsync(id, dto);
            return Ok(guest);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Guest with ID {Id} not found for update", id);
            return NotFound(new { message = ex.Message });
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx && 
                                         pgEx.SqlState == "23503") // Foreign key constraint violation
        {
            string constraintName = pgEx.ConstraintName ?? string.Empty;
            string entityName = "a related entity";
            
            if (constraintName.Contains("FK_Guests_Professions"))
                entityName = "the specified profession";
            else if (constraintName.Contains("FK_Guests_Cities"))
                entityName = "the specified city";
            else if (constraintName.Contains("FK_Guests_Countries"))
                entityName = "the specified country";
                
            _logger.LogWarning(ex, "Foreign key constraint violation: {Constraint} for guest update {Id}", constraintName, id);
            return BadRequest(new { 
                message = $"Error updating guest with ID {id}", 
                details = $"Failed to update guest because {entityName} doesn't exist. Please select valid values."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating guest with ID {Id}", id);
            return StatusCode(500, new { message = $"Error updating guest with ID {id}", details = ex.Message });
        }
    }

    // DELETE: api/guests/{id}
    [HttpDelete("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _guestService.DeleteAsync(id);
            if (!result) return NotFound(new { message = $"Guest with ID {id} not found" });
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting guest with ID {Id}", id);
            return StatusCode(500, new { message = $"Error deleting guest with ID {id}", details = ex.Message });
        }
    }
}