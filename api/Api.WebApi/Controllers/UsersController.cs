// Api.WebApi/Controllers/UsersController.cs
using Api.Application.DTOs.User;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        return Ok(await _userService.GetAllAsync());
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
    [RequireAccessLevel(AccessLevel.Admin)]
    public async Task<ActionResult<UserDto>> Create(CreateUserDto dto)
    {
        try
        {
            var user = await _userService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
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
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var emailClaim = User.Claims.FirstOrDefault(c => c.Type == "email");
        if (emailClaim == null)
        {
            return Unauthorized();
        }

        var user = await _userService.GetFromClerkAsync(emailClaim.Value);
    
        if (user == null)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            var firstName = User.Claims.FirstOrDefault(c => c.Type == "given_name")?.Value ?? "User";
            var lastName = User.Claims.FirstOrDefault(c => c.Type == "family_name")?.Value ?? "";

            try {
                user = await _userService.CreateFromClerkAsync(
                    userIdClaim ?? string.Empty,
                    emailClaim.Value,
                    firstName,
                    lastName
                );
            }
            catch (InvalidOperationException ex) {
                return BadRequest(ex.Message);
            }
        }

        return Ok(user);
    }
}
