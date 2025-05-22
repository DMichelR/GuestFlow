// Api.WebApi/Controllers/UsersController.cs
using Api.Application.DTOs.User;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Activado el atributo Authorize
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("Admin")]
    //[RequireAccessLevel(AccessLevel.Admin)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllAdmin()
    {
        try
        {
            var users = await _userService.GetAllGerentAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all users");
            return StatusCode(500, new { message = "Error retrieving users" });
        }
    }

    [HttpGet]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        try
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all users");
            return StatusCode(500, new { message = "Error retrieving users" });
        }
    }

    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpGet("byEmail/{email}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<UserDto>> GetByEmail(string email)
    {
        var user = await _userService.GetByEmailAsync(email);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<UserDto>> Create(CreateUserDto dto)
    {
        try
        {
            // Obtener el ClerkId del header de la solicitud
            if (!Request.Headers.TryGetValue("X-ClerkId", out var clerkIdValues) || string.IsNullOrEmpty(clerkIdValues))
            {
                return BadRequest("El header X-ClerkId es requerido");
            }
            
            string clerkId = clerkIdValues.ToString();
            var user = await _userService.CreateAsync(dto, clerkId);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Error creating user");
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("Managers")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<UserDto>> CreateManager(CreateUserDto dto)
    {
        try
        {
            // Validar que el tenantId esté presente en el DTO
            if (!Request.Headers.TryGetValue("X-ClerkId", out var clerkIdValues) || string.IsNullOrEmpty(clerkIdValues))
            {
                return BadRequest("El header X-ClerkId es requerido");
            }
            
            // Validar que se proporcione un tenantId
            if (dto.TenantId == null || dto.TenantId == Guid.Empty)
            {
                return BadRequest("El TenantId es requerido para crear un manager");
            }
            
            // Validar que el nivel de acceso sea de manager
            if (dto.AccessLevel != AccessLevel.Manager)
            {
                _logger.LogWarning("Intento de crear un usuario con nivel de acceso {AccessLevel} a través del endpoint de managers", dto.AccessLevel);
                dto.AccessLevel = AccessLevel.Manager; // Forzar a que sea manager independientemente de lo que se envíe
            }
            
            string clerkId = clerkIdValues.ToString();
            
            // Usar el mismo servicio pero con validación específica para managers
            var user = await _userService.CreateAsync(dto, clerkId);
            
            _logger.LogInformation("Manager creado exitosamente con ID: {UserId}", user.Id);
            
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Error creating manager");
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<UserDto>> Update(Guid id, UpdateUserDto dto)
    {
        try
        {
            var user = await _userService.UpdateAsync(id, dto);
            if (user == null) return NotFound();
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [RequireAccessLevel(AccessLevel.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _userService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
