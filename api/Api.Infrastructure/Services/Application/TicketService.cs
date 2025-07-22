// Api.Infrastructure/Services/Application/TicketService.cs
using Api.Application.DTOs.Service;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.ServiceRelated;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class TicketService : ITicketService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<TicketService> _logger;

    public TicketService(
        IApplicationDbContext dbContext,
        IJwtContextService jwtContextService,
        ILogger<TicketService> logger)
    {
        _dbContext = dbContext;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    public async Task<TicketDto> GetByIdAsync(Guid id)
    {
        var ticket = await _dbContext.ServiceTickets
            .Include(t => t.Service)
            .Include(t => t.User)
            .Include(t => t.Stay)
            .Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.Id == id);
            
        return ticket != null ? MapToDto(ticket) : null!;
    }

    public async Task<IEnumerable<TicketDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<TicketDto>();
        }
        
        var tickets = await _dbContext.ServiceTickets
            .Include(t => t.Service)
            .Include(t => t.User)
            .Include(t => t.Stay)
            .Include(t => t.Tenant)
            .Where(t => t.TenantId == tenantId.Value)
            .ToListAsync();
            
        return tickets.Select(MapToDto);
    }

    public async Task<IEnumerable<TicketDto>> GetByStayIdAsync(Guid stayId)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<TicketDto>();
        }
        
        // Verificar que la estancia existe y pertenece al tenant actual
        var stay = await _dbContext.Stays.FindAsync(stayId);
        if (stay == null || stay.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Stay not found or not accessible for tenant");
            return Enumerable.Empty<TicketDto>();
        }
        
        var tickets = await _dbContext.ServiceTickets
            .Include(t => t.Service)
            .Include(t => t.User)
            .Include(t => t.Stay)
            .Include(t => t.Tenant)
            .Where(t => t.StayId == stayId && t.TenantId == tenantId.Value)
            .ToListAsync();
            
        return tickets.Select(MapToDto);
    }

    public async Task<TicketDto> CreateAsync(CreateTicketDto dto)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Tenant ID is required");
        }

        // Validar que el servicio existe
        var service = await _dbContext.Services.FindAsync(dto.ServiceId);
        if (service == null || service.TenantId != tenantId.Value)
        {
            throw new InvalidOperationException("Service not found or not accessible");
        }
        
        // Validar que el usuario existe
        var user = await _dbContext.Users.FindAsync(dto.UserId);
        if (user == null || user.TenantId != tenantId.Value)
        {
            throw new InvalidOperationException("User not found or not accessible");
        }
        
        // Validar que la estancia existe
        var stay = await _dbContext.Stays.FindAsync(dto.StayId);
        if (stay == null || stay.TenantId != tenantId.Value)
        {
            throw new InvalidOperationException("Stay not found or not accessible");
        }

        var tenant = await _dbContext.Tenants.FindAsync(tenantId.Value);
        if (tenant == null)
        {
            throw new InvalidOperationException("Tenant not found");
        }

        var ticket = new ServiceTicket
        {
            StayId = dto.StayId,
            ServiceId = dto.ServiceId,
            UserId = dto.UserId,
            Price = dto.Price,
            Notes = dto.Notes,
            TenantId = tenantId.Value,
            Tenant = tenant,
            Stay = stay,
            Service = service,
            User = user
        };

        await _dbContext.ServiceTickets.AddAsync(ticket);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(ticket.Id);
    }

    public async Task<TicketDto> UpdateAsync(Guid id, UpdateTicketDto dto)
    {
        var ticket = await _dbContext.ServiceTickets
            .Include(t => t.Service)
            .Include(t => t.User)
            .Include(t => t.Stay)
            .FirstOrDefaultAsync(t => t.Id == id);
            
        if (ticket == null) return null!;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || ticket.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Actualizar propiedades si se proporcionaron
        if (dto.ServiceId.HasValue && dto.ServiceId.Value != ticket.ServiceId)
        {
            var service = await _dbContext.Services.FindAsync(dto.ServiceId.Value);
            if (service == null || service.TenantId != tenantId.Value)
            {
                throw new InvalidOperationException("Service not found or not accessible");
            }
            ticket.ServiceId = dto.ServiceId.Value;
            ticket.Service = service;
        }

        if (dto.UserId.HasValue && dto.UserId.Value != ticket.UserId)
        {
            var user = await _dbContext.Users.FindAsync(dto.UserId.Value);
            if (user == null || user.TenantId != tenantId.Value)
            {
                throw new InvalidOperationException("User not found or not accessible");
            }
            ticket.UserId = dto.UserId.Value;
            ticket.User = user;
        }

        if (dto.Price.HasValue)
        {
            ticket.Price = dto.Price.Value;
        }

        if (dto.Notes != null)
        {
            ticket.Notes = dto.Notes;
        }

        _dbContext.ServiceTickets.Update(ticket);
        await _dbContext.SaveChangesAsync();
        
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var ticket = await _dbContext.ServiceTickets.FindAsync(id);
        
        if (ticket == null) return false;

        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue || ticket.TenantId != tenantId.Value)
        {
            _logger.LogWarning("Tenant ID mismatch or not found in JWT when deleting ticket");
            throw new InvalidOperationException("Unauthorized tenant access");
        }

        // Soft delete: set IsActive to false instead of removing the record
        ticket.IsActive = false;
        var result = await _dbContext.SaveChangesAsync();
        return result > 0;
    }

    private TicketDto MapToDto(ServiceTicket ticket)
    {
        return new TicketDto
        {
            Id = ticket.Id,
            StayId = ticket.StayId,
            StayReservationNumber = ticket.Stay?.Id.ToString() ?? "N/A",
            ServiceId = ticket.ServiceId,
            ServiceName = ticket.Service?.Name ?? "N/A",
            UserId = ticket.UserId,
            UserName = $"{ticket.User?.FirstName ?? "N/A"} {ticket.User?.LastName ?? ""}",
            Price = ticket.Price,
            Notes = ticket.Notes,
            TenantId = ticket.TenantId,
            TenantName = ticket.Tenant?.Name ?? "N/A",
            Created = ticket.Created,
            Updated = ticket.Updated
        };
    }
}
