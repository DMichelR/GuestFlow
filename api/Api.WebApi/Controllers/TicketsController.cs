using Api.Application.DTOs.Service;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly ILogger<TicketsController> _logger;

    public TicketsController(ITicketService ticketService, ILogger<TicketsController> logger)
    {
        _ticketService = ticketService;
        _logger = logger;
    }

    // GET: api/tickets
    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetAll()
    {
        try
        {
            var tickets = await _ticketService.GetAllAsync();
            return Ok(tickets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tickets");
            return StatusCode(500, new { message = "Error retrieving tickets" });
        }
    }
    
    // GET: api/tickets/byStay/{stayId}
    [HttpGet("byStay/{stayId}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetByStayId(Guid stayId)
    {
        try
        {
            var tickets = await _ticketService.GetByStayIdAsync(stayId);
            return Ok(tickets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tickets for stay ID: {StayId}", stayId);
            return StatusCode(500, new { message = "Error retrieving tickets" });
        }
    }
    
    // GET: api/tickets/{id}
    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<TicketDto>> GetById(Guid id)
    {
        try
        {
            var ticket = await _ticketService.GetByIdAsync(id);
            if (ticket == null) return NotFound();
            return Ok(ticket);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ticket with ID: {TicketId}", id);
            return StatusCode(500, new { message = "Error retrieving ticket" });
        }
    }
    
    // POST: api/tickets
    [HttpPost]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<TicketDto>> Create(CreateTicketDto dto)
    {
        try
        {
            var ticket = await _ticketService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when creating ticket");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating ticket");
            return StatusCode(500, new { message = "Error creating ticket" });
        }
    }
    
    // PUT: api/tickets/{id}
    [HttpPut("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<TicketDto>> Update(Guid id, UpdateTicketDto dto)
    {
        try
        {
            var ticket = await _ticketService.UpdateAsync(id, dto);
            if (ticket == null) return NotFound();
            return Ok(ticket);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when updating ticket ID: {TicketId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating ticket ID: {TicketId}", id);
            return StatusCode(500, new { message = "Error updating ticket" });
        }
    }
    
    // DELETE: api/tickets/{id}
    [HttpDelete("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _ticketService.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when deleting ticket ID: {TicketId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ticket ID: {TicketId}", id);
            return StatusCode(500, new { message = "Error deleting ticket" });
        }
    }
}