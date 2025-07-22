// Api.WebApi/Controllers/RoomsController.cs
using Api.Application.DTOs.Room;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;
    private readonly ILogger<RoomsController> _logger;

    public RoomsController(IRoomService roomService, ILogger<RoomsController> logger)
    {
        _roomService = roomService;
        _logger = logger;
    }
    // GET: api/rooms/available
    [HttpGet("available")]
    [RequireAccessLevel(AccessLevel.Receptionist)]
    public async Task<ActionResult<List<RoomDto>>> GetAllRoomsFreeOnDateRange(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate
    )
    {
        startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
        endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);

        var rooms = await _roomService.GetAllRoomsFreeOnDateRange(startDate, endDate);

        return Ok(rooms);
    }

    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<RoomDto>>> GetAll()
    {
        var rooms = await _roomService.GetAllAsync();
        return Ok(rooms);
    }

    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<RoomDto>> GetById(Guid id)
    {
        var room = await _roomService.GetByIdAsync(id);
        if (room == null) return NotFound();
        return Ok(room);
    }

    [HttpGet("number/{number}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<RoomDto>> GetByNumber(string number)
    {
        try
        {
            var room = await _roomService.GetByNumberAsync(number);
            if (room == null) return NotFound();
            return Ok(room);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error retrieving room with number {Number}", number);
            return BadRequest(ex.Message);
        }
    }

    [HttpPost]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<RoomDto>> Create(CreateRoomDto dto)
    {
        try
        {
            var room = await _roomService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = room.Id }, room);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<RoomDto>> Update(Guid id, UpdateRoomDto dto)
    {
        try
        {
            var room = await _roomService.UpdateAsync(id, dto);
            if (room == null) return NotFound();
            return Ok(room);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _roomService.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
