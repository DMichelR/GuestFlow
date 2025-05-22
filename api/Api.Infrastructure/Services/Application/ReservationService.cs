// Api.Infrastructure/Services/Application/ReservationService.cs
using Api.Application.DTOs.Stay;
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.StayRelated;
using Api.Domain.Enums;
using Api.Domain.Extensions;
using Api.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class ReservationService : IReservationService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtContextService _jwtContextService;
    private readonly IGroupGuestsService _groupGuestsService;
    private readonly IGroupRoomsService _groupRoomsService;
    private readonly ILogger<ReservationService> _logger;

    public ReservationService(
        ApplicationDbContext context,
        IJwtContextService jwtContextService,
        IGroupGuestsService groupGuestsService,
        IGroupRoomsService groupRoomsService,
        ILogger<ReservationService> logger)
    {
        _context = context;
        _jwtContextService = jwtContextService;
        _groupGuestsService = groupGuestsService;
        _groupRoomsService = groupRoomsService;
        _logger = logger;
    }

    public async Task<ReservationDto> GetByIdAsync(Guid id)
    {
        var stay = await _context.Stays
            .Include(s => s.VisitReason)
            .Include(s => s.Guest)
            .Include(s => s.Company)
            .Include(s => s.ServiceTickets)
            .Include(s => s.GroupGuests)
                .ThenInclude(gg => gg.Guest)
            .Include(s => s.GroupRooms)
                .ThenInclude(gr => gr.Room)
            .Include(s => s.Tenant)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        return stay != null ? MapToDto(stay) : null!;
    }

    public async Task<IEnumerable<ReservationDto>> GetAllAsync()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            return Enumerable.Empty<ReservationDto>();
        }
        
        var stays = await _context.Stays
            .Include(s => s.VisitReason)
            .Include(s => s.Guest)
            .Include(s => s.Company)
            .Include(s => s.GroupGuests)
                .ThenInclude(gg => gg.Guest)
            .Include(s => s.GroupRooms)
                .ThenInclude(gr => gr.Room)
            .Include(s => s.Tenant)
            .Where(s => s.ReservationDate != null)
            .Where(s => s.TenantId == tenantId.Value)
            .ToListAsync();
            
        return stays.Select(MapToDto);
    }

    public async Task<ReservationDto> CreateAsync(CreateReservationDto dto)
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT");
            throw new InvalidOperationException("Unable to determine current tenant");
        }
        
        var visitReason = await _context.VisitReasons.FindAsync(dto.VisitReasonId);
        if (visitReason == null)
        {
            throw new InvalidOperationException($"VisitReason with ID {dto.VisitReasonId} not found");
        }
        
        var guest = await _context.Guests.FindAsync(dto.HolderId);
        if (guest == null)
        {
            throw new InvalidOperationException($"Guest with ID {dto.HolderId} not found");
        }
        
        var tenant = await _context.Tenants.FindAsync(tenantId.Value);
        if (tenant == null)
        {
            throw new InvalidOperationException($"Tenant with ID {tenantId.Value} not found");
        }
        
        var stay = new Stay
        {
            VisitReasonId = dto.VisitReasonId,
            VisitReason = visitReason,
            HolderId = dto.HolderId,
            Guest = guest,
            ArrivalDate = dto.ArrivalDate,
            DepartureDate = dto.DepartureDate,
            ReservationDate = DateTime.UtcNow,
            Pax = dto.Pax,
            FinalPrice = dto.FinalPrice,
            Notes = dto.Notes,
            State = StayState.Pending,
            CompanyId = dto.CompanyId,
            TenantId = tenantId.Value,
            Tenant = tenant
        };
        
        await _context.Stays.AddAsync(stay);
        await _context.SaveChangesAsync();
        
        // Add guests
        if (dto.GuestIds.Any())
        {
            await _groupGuestsService.AddGuestsToStayAsync(stay.Id, dto.GuestIds);
        }
        
        // Add rooms
        if (dto.RoomIds.Any())
        {
            await _groupRoomsService.AddRoomsToStayAsync(stay.Id, dto.RoomIds);
        }
        
        // Reload the stay with all the relations
        var createdStay = await _context.Stays
            .Include(s => s.VisitReason)
            .Include(s => s.Guest)
            .Include(s => s.Company)
            .Include(s => s.GroupGuests)
                .ThenInclude(gg => gg.Guest)
            .Include(s => s.GroupRooms)
                .ThenInclude(gr => gr.Room)
            .FirstOrDefaultAsync(s => s.Id == stay.Id);
            
        return MapToDto(createdStay!);
    }

    public async Task<ReservationDto> UpdateAsync(Guid id, UpdateReservationDto dto)
    {
        var stay = await _context.Stays
            .Include(s => s.GroupGuests)
            .Include(s => s.GroupRooms)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        if (stay == null)
        {
            throw new InvalidOperationException($"Reservation with ID {id} not found");
        }
        
        if (dto.VisitReasonId.HasValue) stay.VisitReasonId = dto.VisitReasonId.Value;
        if (dto.HolderId.HasValue) stay.HolderId = dto.HolderId.Value;
        if (dto.ArrivalDate.HasValue) stay.ArrivalDate = dto.ArrivalDate.Value;
        if (dto.DepartureDate.HasValue) stay.DepartureDate = dto.DepartureDate.Value;
        if (dto.Pax.HasValue) stay.Pax = dto.Pax.Value;
        if (dto.FinalPrice.HasValue) stay.FinalPrice = dto.FinalPrice.Value;
        if (dto.Notes != null) stay.Notes = dto.Notes;
        if (dto.State.HasValue) stay.State = dto.State.Value;
        if (dto.CompanyId.HasValue) stay.CompanyId = dto.CompanyId.Value;
        
        _context.Stays.Update(stay);
        await _context.SaveChangesAsync();
        
        // Update guest associations if provided
        if (dto.GuestIds != null)
        {
            await _groupGuestsService.UpdateGuestsForStayAsync(stay.Id, dto.GuestIds);
        }
        
        // Update room associations if provided
        if (dto.RoomIds != null)
        {
            await _groupRoomsService.UpdateRoomsForStayAsync(stay.Id, dto.RoomIds);
        }
        
        // Reload the stay with all the updated relations
        var updatedStay = await _context.Stays
            .Include(s => s.VisitReason)
            .Include(s => s.Guest)
            .Include(s => s.Company)
            .Include(s => s.GroupGuests)
                .ThenInclude(gg => gg.Guest)
            .Include(s => s.GroupRooms)
                .ThenInclude(gr => gr.Room)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        return MapToDto(updatedStay!);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var stay = await _context.Stays.FindAsync(id);
        if (stay == null) return false;

        _context.Stays.Remove(stay);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> AddGuestAsync(Guid reservationId, Guid guestId)
    {
        return await _groupGuestsService.AddGuestToStayAsync(reservationId, guestId);
    }

    public async Task<bool> RemoveGuestAsync(Guid reservationId, Guid guestId)
    {
        return await _groupGuestsService.RemoveGuestFromStayAsync(reservationId, guestId);
    }

    public async Task<bool> AddRoomAsync(Guid reservationId, Guid roomId)
    {
        return await _groupRoomsService.AddRoomToStayAsync(reservationId, roomId);
    }

    public async Task<bool> RemoveRoomAsync(Guid reservationId, Guid roomId)
    {
        return await _groupRoomsService.RemoveRoomFromStayAsync(reservationId, roomId);
    }

    public async Task<bool> ChangeStateAsync(Guid reservationId, string state)
    {
        if (!Enum.TryParse<StayState>(state, true, out var stayState))
        {
            throw new InvalidOperationException($"Invalid stay state: {state}");
        }
        
        var stay = await _context.Stays.FindAsync(reservationId);
        if (stay == null) return false;
        
        stay.State = stayState;
        _context.Stays.Update(stay);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    private ReservationDto MapToDto(Stay stay)
    {
        return new ReservationDto
        {
            Id = stay.Id,
            VisitReasonId = stay.VisitReasonId,
            VisitReasonName = stay.VisitReason?.Name ?? string.Empty,
            HolderId = stay.HolderId,
            HolderName = stay.Guest != null ? GuestExtensions.FullName(stay.Guest) : string.Empty,
            HolderEmail = stay.Guest?.Email ?? string.Empty,
            ArrivalDate = stay.ArrivalDate,
            DepartureDate = stay.DepartureDate,
            ReservationDate = stay.ReservationDate ?? DateTime.UtcNow,
            Pax = stay.Pax,
            FinalPrice = stay.FinalPrice,
            Notes = stay.Notes,
            State = stay.State,
            CompanyId = stay.CompanyId,
            CompanyName = stay.Company?.Name,
            AssignedRooms = stay.GroupRooms?.Select(gr => gr.Room != null ? RoomExtensions.Name(gr.Room) : "Unknown").ToList() ?? new List<string>(),
            Guests = stay.GroupGuests?.Select(gg => gg.Guest != null ? GuestExtensions.FullName(gg.Guest) : "Unknown").ToList() ?? new List<string>()
        };
    }
}
