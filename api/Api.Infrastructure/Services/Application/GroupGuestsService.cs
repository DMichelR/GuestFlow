// Api.Infrastructure/Services/Application/GroupGuestsService.cs
using Api.Application.Interfaces.Services;
using Api.Domain.Entities.Concretes.StayRelated;
using Api.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Application;

public class GroupGuestsService : IGroupGuestsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<GroupGuestsService> _logger;

    public GroupGuestsService(
        ApplicationDbContext context,
        ILogger<GroupGuestsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> AddGuestToStayAsync(Guid stayId, Guid guestId)
    {
        try
        {
            // Check if the association already exists
            var exists = await _context.GroupGuests
                .AnyAsync(gg => gg.StayId == stayId && gg.GuestId == guestId);
                
            if (exists)
            {
                _logger.LogWarning("Guest {GuestId} is already associated with stay {StayId}", guestId, stayId);
                return true; // Already exists, so technically successful
            }

            // Get the stay and guest to ensure they exist
            var stay = await _context.Stays.FindAsync(stayId);
            if (stay == null)
            {
                _logger.LogError("Failed to add guest to stay: Stay {StayId} not found", stayId);
                return false;
            }
            
            var guest = await _context.Guests.FindAsync(guestId);
            if (guest == null)
            {
                _logger.LogError("Failed to add guest to stay: Guest {GuestId} not found", guestId);
                return false;
            }
            
            var groupGuest = new GroupGuests
            {
                StayId = stayId,
                GuestId = guestId,
                Stay = stay,
                Guest = guest,
                Tenant = stay.Tenant,
                TenantId = stay.TenantId
            };
            
            await _context.GroupGuests.AddAsync(groupGuest);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding guest {GuestId} to stay {StayId}", guestId, stayId);
            return false;
        }
    }

    public async Task<bool> RemoveGuestFromStayAsync(Guid stayId, Guid guestId)
    {
        try
        {
            var groupGuest = await _context.GroupGuests
                .FirstOrDefaultAsync(gg => gg.StayId == stayId && gg.GuestId == guestId);
                
            if (groupGuest == null)
            {
                _logger.LogWarning("Guest {GuestId} is not associated with stay {StayId}", guestId, stayId);
                return false;
            }
            
            _context.GroupGuests.Remove(groupGuest);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing guest {GuestId} from stay {StayId}", guestId, stayId);
            return false;
        }
    }

    public async Task<IEnumerable<GroupGuests>> GetGuestsByStayIdAsync(Guid stayId)
    {
        try
        {
            return await _context.GroupGuests
                .Include(gg => gg.Guest)
                .Where(gg => gg.StayId == stayId)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving guests for stay {StayId}", stayId);
            return Enumerable.Empty<GroupGuests>();
        }
    }

    public async Task<bool> AddGuestsToStayAsync(Guid stayId, IEnumerable<Guid> guestIds)
    {
        try
        {
            // Check if the stay exists
            var stay = await _context.Stays.FindAsync(stayId);
            if (stay == null)
            {
                _logger.LogError("Failed to add guests to stay: Stay {StayId} not found", stayId);
                return false;
            }
            
            // Filter out already associated guests
            var existingGuestIds = await _context.GroupGuests
                .Where(gg => gg.StayId == stayId)
                .Select(gg => gg.GuestId)
                .ToListAsync();
                
            var newGuestIds = guestIds.Except(existingGuestIds).ToList();
            
            // Get all guests at once to verify they exist
            var guests = await _context.Guests
                .Where(g => newGuestIds.Contains(g.Id))
                .ToDictionaryAsync(g => g.Id, g => g);
            
            foreach (var guestId in newGuestIds)
            {
                if (!guests.TryGetValue(guestId, out var guest))
                {
                    _logger.LogWarning("Guest {GuestId} not found, skipping", guestId);
                    continue;
                }
                
                var groupGuest = new GroupGuests
                {
                    StayId = stayId,
                    GuestId = guestId,
                    Stay = stay,
                    Guest = guest,
                    Tenant = stay.Tenant,
                    TenantId = stay.TenantId
                };
                
                await _context.GroupGuests.AddAsync(groupGuest);
            }
            
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding guests to stay {StayId}", stayId);
            return false;
        }
    }

    public async Task<bool> UpdateGuestsForStayAsync(Guid stayId, IEnumerable<Guid> newGuestIds)
    {
        try
        {
            // Get current guests
            var currentGuestAssociations = await _context.GroupGuests
                .Where(gg => gg.StayId == stayId)
                .ToListAsync();
            
            var currentGuestIds = currentGuestAssociations.Select(gg => gg.GuestId).ToList();
            var newGuestIdsList = newGuestIds.ToList();
            
            // Remove guests that are no longer in the list
            var guestsToRemove = currentGuestAssociations
                .Where(gg => !newGuestIdsList.Contains(gg.GuestId))
                .ToList();
                
            foreach (var groupGuest in guestsToRemove)
            {
                _context.GroupGuests.Remove(groupGuest);
            }
            
            // Add new guests
            var guestIdsToAdd = newGuestIdsList.Except(currentGuestIds).ToList();
            
            if (guestIdsToAdd.Any())
            {
                await AddGuestsToStayAsync(stayId, guestIdsToAdd);
            }
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating guests for stay {StayId}", stayId);
            return false;
        }
    }
}
