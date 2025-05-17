using Api.Application.DTOs;
using Api.Application.Interfaces;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;
[ApiController]
[Route("api/[controller]")]
[Authorize] // Añadido el atributo Authorize
public class TenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;

    public TenantsController(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }
    
    [HttpGet]
    [RequireAccessLevel(AccessLevel.Admin)]
    public async Task<ActionResult<IEnumerable<TenantDto>>> GetAll()
    {
        return Ok(await _tenantService.GetAllAsync());
    }
    
    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<TenantDto>> GetById(Guid id)
    {
        var tenant = await _tenantService.GetByIdAsync(id);
        if (tenant == null) return NotFound();
        return Ok(tenant);
    }
    
    [HttpPost]
    [RequireAccessLevel(AccessLevel.Admin)]
    public async Task<ActionResult<TenantDto>> Create(CreateTenantDto dto)
    {
        var tenant = await _tenantService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = tenant.Id }, tenant);
    }
    
    [HttpPut("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<TenantDto>> Update(Guid id, UpdateTenantDto dto)
    {
        var tenant = await _tenantService.UpdateAsync(id, dto);
        if (tenant == null) return NotFound();
        return Ok(tenant);
    }

    [HttpDelete("{id}")]
    [RequireAccessLevel(AccessLevel.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _tenantService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
