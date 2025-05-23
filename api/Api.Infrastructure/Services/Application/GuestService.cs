using Api.Application.DTOs.Guest;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.GuestRelated;
using Api.Domain.Extensions;
using Microsoft.EntityFrameworkCore;
using Api.Infrastructure.DataBase;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class GuestService : IGuestService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<GuestService> _logger;
    
    public GuestService(ApplicationDbContext context, IJwtContextService jwtContextService, ILogger<GuestService> logger)
    {
        _context = context;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    public async Task<GuestDto> GetByIdAsync(Guid id)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }
        
        var guest = await _context.Set<Guest>()
            .Include(g => g.Profession)
            .Include(g => g.City)
            .Include(g => g.Country)
            .FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId.Value);

        if (guest == null)
            return null!;

        return MapToDto(guest);
    }

    public async Task<IEnumerable<GuestDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<GuestDto>();
        }
        
        var guests = await _context.Set<Guest>()
            .Include(g => g.Profession)
            .Include(g => g.City)
            .Include(g => g.Country)
            .Where(g => g.TenantId == tenantId.Value)
            .ToListAsync();

        return guests.Select(MapToDto);
    }

    public async Task<GuestDto> CreateAsync(CreateGuestDto dto)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }
        
        var tenant = await _context.Tenants.FindAsync(tenantId.Value);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }
        
        var city = await _context.Cities.FindAsync(dto.CityId);
        if (city == null)
        {
            throw new InvalidOperationException($"City with ID {dto.CityId} not found");
        }
        
        var country = await _context.Countries.FindAsync(dto.CountryId);
        if (country == null)
        {
            throw new InvalidOperationException($"Country with ID {dto.CountryId} not found");
        }
        
        var guest = new Guest
        {
            TenantId = tenantId.Value,
            Name = dto.Name,
            LastName = dto.LastName,
            Cid = dto.Cid,
            Birthday = DateTime.SpecifyKind(dto.Birthday, DateTimeKind.Utc),
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            ProfessionId = dto.ProfessionId ?? default,
            CityId = dto.CityId,
            CountryId = dto.CountryId,
            Tenant = tenant,
            City = city,
            Country = country
        };

        _context.Set<Guest>().Add(guest);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(guest.Id);
    }

    public async Task<GuestDto> UpdateAsync(Guid id, UpdateGuestDto dto)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }
        
        var guest = await _context.Set<Guest>()
            .Include(g => g.Tenant)
            .Include(g => g.City)
            .Include(g => g.Country)
            .FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId.Value);

        if (guest == null)
            throw new InvalidOperationException($"Guest with ID {id} not found");

        // Obtener entidades relacionadas si cambiaron
        if (guest.CityId != dto.CityId)
        {
            var city = await _context.Cities.FindAsync(dto.CityId);
            if (city == null)
                throw new InvalidOperationException($"City with ID {dto.CityId} not found");
            guest.City = city;
        }
        
        if (guest.CountryId != dto.CountryId)
        {
            var country = await _context.Countries.FindAsync(dto.CountryId);
            if (country == null)
                throw new InvalidOperationException($"Country with ID {dto.CountryId} not found");
            guest.Country = country;
        }

        guest.Name = dto.Name;
        guest.LastName = dto.LastName;
        guest.Cid = dto.Cid;
        guest.Birthday = dto.Birthday;
        guest.Email = dto.Email;
        guest.Phone = dto.Phone;
        guest.Address = dto.Address;
        guest.ProfessionId = dto.ProfessionId ?? default;
        guest.CityId = dto.CityId;
        guest.CountryId = dto.CountryId;

        _context.Set<Guest>().Update(guest);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(guest.Id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT when deleting guest");
            throw new InvalidOperationException("Tenant ID is required");
        }
        
        var guest = await _context.Set<Guest>()
            .FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId.Value);

        if (guest == null)
            return false;
            
        // Verificar si el huésped está relacionado con estancias o grupos
        var inUseInGroupGuests = await _context.Set<Api.Domain.Entities.Concretes.StayRelated.GroupGuests>()
            .AnyAsync(gg => gg.GuestId == id);
        
        if (inUseInGroupGuests)
        {
            throw new InvalidOperationException("Cannot delete guest that is assigned to groups");
        }
            
        _context.Set<Guest>().Remove(guest);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<GuestDto?> GetByCidAsync(string cid)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return null;
        }
        
        var guest = await _context.Set<Guest>()
            .Include(g => g.Profession)
            .Include(g => g.City)
            .Include(g => g.Country)
            .FirstOrDefaultAsync(g => g.Cid == cid && g.TenantId == tenantId.Value);

        if (guest == null)
            return null;

        return MapToDto(guest);
    }

    public async Task<IEnumerable<GuestDto>> SearchAsync(string term)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<GuestDto>();
        }
        
        term = term.ToLower();
        
        var guests = await _context.Set<Guest>()
            .Include(g => g.Profession)
            .Include(g => g.City)
            .Include(g => g.Country)
            .Where(g => g.TenantId == tenantId.Value && 
                  (g.Name.ToLower().Contains(term) || 
                   g.LastName.ToLower().Contains(term) || 
                   g.Cid.ToLower().Contains(term) ||
                   g.Email.ToLower().Contains(term)))
            .ToListAsync();

        return guests.Select(MapToDto);
    }
    
    private GuestDto MapToDto(Guest guest)
    {
        return new GuestDto
        {
            Id = guest.Id,
            TenantId = guest.TenantId,
            
            Name = guest.Name,
            LastName = guest.LastName,
            FullName = guest.FullName(),
            Cid = guest.Cid,
            Birthday = guest.Birthday,
            Email = guest.Email,
            Phone = guest.Phone,
            Address = guest.Address,
            
            ProfessionId = guest.ProfessionId,
            ProfessionName = guest.Profession?.Name,
            CityId = guest.CityId,
            CityName = guest.City?.Name ?? string.Empty,
            CountryId = guest.CountryId,
            CountryName = guest.Country?.Name ?? string.Empty
        };
    }
}
