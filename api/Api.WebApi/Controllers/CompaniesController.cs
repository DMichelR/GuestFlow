using Api.Application.DTOs.Company;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ILogger<CompaniesController> _logger;

    public CompaniesController(ICompanyService companyService, ILogger<CompaniesController> logger)
    {
        _companyService = companyService;
        _logger = logger;
    }

    // GET: api/companies
    [HttpGet]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IEnumerable<CompanyDto>>> GetAll()
    {
        try
        {
            var companies = await _companyService.GetAllAsync();
            return Ok(companies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all companies");
            return StatusCode(500, new { message = "Error retrieving companies" });
        }
    }

    // GET: api/companies/{id}
    [HttpGet("{id}")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<CompanyDto>> GetById(Guid id)
    {
        try
        {
            var company = await _companyService.GetByIdAsync(id);
            if (company == null) return NotFound(new { message = $"Company with ID {id} not found" });
            return Ok(company);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving company with ID {Id}", id);
            return StatusCode(500, new { message = $"Error retrieving company with ID {id}" });
        }
    }

    // POST: api/companies
    [HttpPost]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<CompanyDto>> Create(CreateCompanyDto dto)
    {
        try
        {
            var company = await _companyService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = company.Id }, company);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Validation error while creating company");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating company");
            return StatusCode(500, new { message = "Error creating company", details = ex.Message });
        }
    }

    // PUT: api/companies/{id}
    [HttpPut("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<ActionResult<CompanyDto>> Update(Guid id, UpdateCompanyDto dto)
    {
        try
        {
            var company = await _companyService.UpdateAsync(id, dto);
            return Ok(company);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning(ex, "Company with ID {Id} not found", id);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Validation error while updating company with ID {Id}", id);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating company with ID {Id}", id);
            return StatusCode(500, new { message = $"Error updating company with ID {id}", details = ex.Message });
        }
    }

    // DELETE: api/companies/{id}
    [HttpDelete("{id}")]
    [RequireAccessLevel(AccessLevel.Manager)]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _companyService.DeleteAsync(id);
            if (!result) return NotFound(new { message = $"Company with ID {id} not found" });
            return NoContent();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("associated"))
        {
            _logger.LogWarning(ex, "Cannot delete company {Id} because it's in use", id);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting company with ID {Id}", id);
            return StatusCode(500, new { message = $"Error deleting company with ID {id}", details = ex.Message });
        }
    }
}