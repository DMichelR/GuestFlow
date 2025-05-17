// Api.WebApi/Controllers/RoomTypesController.cs
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
public class RoomTypesController : ControllerBase
{
    private readonly IRoomTypeService _roomTypeService;
    private readonly ILogger<RoomTypesController> _logger;

    public RoomTypesController(IRoomTypeService roomTypeService, ILogger<RoomTypesController> logger)
    {
        _roomTypeService = roomTypeService;
        _logger = logger;
    }

    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<RoomTypeDto>>> GetAll()
    {
        var roomTypes = await _roomTypeService.GetAllAsync();
        return Ok(roomTypes);
    }

    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<RoomTypeDto>> GetById(Guid id)
    {
        var roomType = await _roomTypeService.GetByIdAsync(id);
        if (roomType == null) return NotFound();
        return Ok(roomType);
    }

    [HttpPost]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<RoomTypeDto>> Create(CreateRoomTypeDto dto)
    {
        try
        {
            var roomType = await _roomTypeService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = roomType.Id }, roomType);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<RoomTypeDto>> Update(Guid id, UpdateRoomTypeDto dto)
    {
        try
        {
            var roomType = await _roomTypeService.UpdateAsync(id, dto);
            if (roomType == null) return NotFound();
            return Ok(roomType);
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
            var result = await _roomTypeService.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
