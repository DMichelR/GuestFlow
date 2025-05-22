// Api.WebApi/Controllers/ReservationsController.cs
using Api.Application.DTOs.Stay;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;
    private readonly ILogger<ReservationsController> _logger;

    public ReservationsController(IReservationService reservationService, ILogger<ReservationsController> logger)
    {
        _reservationService = reservationService;
        _logger = logger;
    }

    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAll()
    {
        var reservations = await _reservationService.GetAllAsync();
        return Ok(reservations);
    }

    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<ReservationDto>> GetById(Guid id)
    {
        var reservation = await _reservationService.GetByIdAsync(id);
        if (reservation == null) return NotFound();
        return Ok(reservation);
    }

    [HttpPost]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<ReservationDto>> Create(CreateReservationDto dto)
    {
        try
        {
            var reservation = await _reservationService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = reservation.Id }, reservation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<ReservationDto>> Update(Guid id, UpdateReservationDto dto)
    {
        try
        {
            var reservation = await _reservationService.UpdateAsync(id, dto);
            return Ok(reservation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult> Delete(Guid id)
    {
        var result = await _reservationService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/guests/{guestId}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult> AddGuest(Guid id, Guid guestId)
    {
        var result = await _reservationService.AddGuestAsync(id, guestId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}/guests/{guestId}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult> RemoveGuest(Guid id, Guid guestId)
    {
        var result = await _reservationService.RemoveGuestAsync(id, guestId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/rooms/{roomId}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult> AddRoom(Guid id, Guid roomId)
    {
        var result = await _reservationService.AddRoomAsync(id, roomId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}/rooms/{roomId}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult> RemoveRoom(Guid id, Guid roomId)
    {
        var result = await _reservationService.RemoveRoomAsync(id, roomId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id}/state/{state}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult> ChangeState(Guid id, string state)
    {
        try
        {
            var result = await _reservationService.ChangeStateAsync(id, state);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
