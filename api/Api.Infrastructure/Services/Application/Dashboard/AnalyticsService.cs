using Api.Application.DTOs.Dashboard;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Application.Interfaces.Services.Dashboard;
using Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Globalization;

namespace Api.Infrastructure.Services.Application.Dashboard;

public class AnalyticsService : IAnalyticsService
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtContextService _jwtContextService;
    private readonly ILogger<AnalyticsService> _logger;

    public AnalyticsService(
        IApplicationDbContext context,
        IJwtContextService jwtContextService,
        ILogger<AnalyticsService> logger)
    {
        _context = context;
        _jwtContextService = jwtContextService;
        _logger = logger;
    }

    private Guid? GetCurrentTenantId()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Unable to get current tenant ID from JWT in AnalyticsService");
        }
        else
        {
            _logger.LogInformation("Successfully obtained tenant ID: {TenantId}", tenantId.Value);
        }
        return tenantId;
    }

    public async Task<IncomeAndCancellationsDto> GetIncomeAndCancellationsAsync(DateTime fromDate, DateTime toDate)
    {
        var tenantId = GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Cannot get income and cancellations without tenant ID");
            return new IncomeAndCancellationsDto(
                new List<DailyIncomeDto>(), 
                new CancelStatsDto(0, 0), 
                0, 
                new List<VisitReasonCancellationDto>()
            );
        }
        
        // Ensure dates are in UTC for proper comparison
        var fromDateUtc = DateTime.SpecifyKind(fromDate.Date, DateTimeKind.Utc);
        var toDateUtc = DateTime.SpecifyKind(toDate.Date, DateTimeKind.Utc); // Fix: Use exact end date, not next day

        // Get stays that overlap with the date range (not just those starting in the range)
        var staysWithServices = await _context.Stays
            .Include(s => s.ServiceTickets)
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State != StayState.Canceled)
            .Where(s => s.ArrivalDate.Date <= toDateUtc && s.DepartureDate.Date >= fromDateUtc) // Overlapping stays - use .Date for date comparison
            .Select(s => new
            {
                s.ArrivalDate,
                s.DepartureDate,
                s.FinalPrice,
                ServiceTicketsTotal = s.ServiceTickets.Sum(st => st.Price)
            })
            .ToListAsync();

        // Initialize dictionary with all dates in range to ensure complete data
        var dailyIncomeDict = new Dictionary<DateTime, decimal>();
        for (var date = fromDateUtc; date <= toDateUtc; date = date.AddDays(1))
        {
            dailyIncomeDict[date] = 0;
        }
        
        foreach (var stay in staysWithServices)
        {
            var stayStart = stay.ArrivalDate.Date > fromDateUtc ? stay.ArrivalDate.Date : fromDateUtc;
            var stayEnd = stay.DepartureDate.Date < toDateUtc ? stay.DepartureDate.Date : toDateUtc;
            
            var totalStayIncome = (stay.FinalPrice ?? 0) + stay.ServiceTicketsTotal;
            var totalStayDays = (stay.DepartureDate.Date - stay.ArrivalDate.Date).Days;
            if (totalStayDays <= 0) totalStayDays = 1; // Minimum 1 day
            
            var dailyIncome = totalStayIncome / totalStayDays;
            
            // Distribute income across each day of the stay within the query range
            for (var date = stayStart; date <= stayEnd; date = date.AddDays(1))
            {
                dailyIncomeDict[date] += dailyIncome;
            }
        }

        // Convert to ordered list
        var dailyIncomeQuery = dailyIncomeDict
            .Select(kvp => new DailyIncomeDto(kvp.Key, Math.Round(kvp.Value, 2)))
            .OrderBy(d => d.Date)
            .ToList();

        // Get cancellation statistics for reservations that had check-in in the date range
        var totalReservationsInPeriod = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.ArrivalDate.Date >= fromDateUtc && s.ArrivalDate.Date <= toDateUtc)
            .CountAsync();

        var cancelledReservations = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State == StayState.Canceled)
            .Where(s => s.ArrivalDate.Date >= fromDateUtc && s.ArrivalDate.Date <= toDateUtc)
            .CountAsync();

        var cancellationPercentage = totalReservationsInPeriod > 0 
            ? Math.Round((decimal)cancelledReservations / totalReservationsInPeriod * 100, 2)
            : 0;

        var cancelStats = new CancelStatsDto(cancelledReservations, cancellationPercentage);

        // Calculate historical cancellation percentage (all time)
        var totalHistoricalReservations = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .CountAsync();

        var totalHistoricalCancellations = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State == StayState.Canceled)
            .CountAsync();

        var historicalCancellationPercentage = totalHistoricalReservations > 0 
            ? Math.Round((decimal)totalHistoricalCancellations / totalHistoricalReservations * 100, 2)
            : 0;

        // Get historical cancellation statistics by visit reason (all time, not limited by date range)
        // First fetch the raw data with visit reason names
        var cancelledStaysWithReasons = await _context.Stays
            .Include(s => s.VisitReason)
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State == StayState.Canceled)
            .Select(s => new { VisitReasonName = s.VisitReason.Name })
            .ToListAsync();

        // Process the grouping in memory to avoid EF translation issues
        var visitReasonCancellations = cancelledStaysWithReasons
            .GroupBy(s => s.VisitReasonName)
            .Select(g => new VisitReasonCancellationDto(g.Key, g.Count()))
            .OrderByDescending(vrc => vrc.CancelledCount)
            .ToList();

        return new IncomeAndCancellationsDto(
            dailyIncomeQuery, 
            cancelStats, 
            historicalCancellationPercentage,
            visitReasonCancellations
        );
    }

    public async Task<FutureReservationsDto> GetFutureReservationsAsync(DateTime futureFrom, DateTime futureTo)
    {
        var tenantId = GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Cannot get future reservations without tenant ID");
            return new FutureReservationsDto(new List<WeeklyReservationsDto>());
        }
        
        // Ensure dates are in UTC for proper comparison
        var futureFromUtc = DateTime.SpecifyKind(futureFrom.Date, DateTimeKind.Utc);
        var futureToUtc = DateTime.SpecifyKind(futureTo.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        // Get future reservations grouped by week based on check-in dates (ArrivalDate)
        var futureReservations = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State != StayState.Canceled)
            .Where(s => s.ArrivalDate >= futureFromUtc && s.ArrivalDate <= futureToUtc)
            .ToListAsync();

        // Group by week number using ISO 8601 format
        var weeklyReservations = futureReservations
            .GroupBy(s => GetIsoWeekString(s.ArrivalDate))
            .Select(g => new WeeklyReservationsDto(g.Key, g.Count()))
            .OrderBy(w => w.Week)
            .ToList();

        return new FutureReservationsDto(weeklyReservations);
    }

    public async Task<ServicesAnalyticsDto> GetServicesAnalyticsAsync(DateTime fromDate, DateTime toDate)
    {
        var tenantId = GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Cannot get services analytics without tenant ID");
            return new ServicesAnalyticsDto(new List<TopServiceDto>(), 0, new List<DailyServiceIncomeDto>());
        }
        
        // Ensure dates are in UTC for proper comparison
        var fromDateUtc = DateTime.SpecifyKind(fromDate.Date, DateTimeKind.Utc);
        var toDateUtc = DateTime.SpecifyKind(toDate.Date, DateTimeKind.Utc); // Fix: Use exact end date, not next day

        // Get service tickets with service and stay information for stays that overlap with the date range
        var serviceTickets = await _context.ServiceTickets
            .Include(st => st.Service)
            .Include(st => st.Stay)
            .Where(st => st.TenantId == tenantId.Value)
            .Where(st => st.IsActive && st.Service.IsActive)
            .Where(st => st.Stay.ArrivalDate.Date <= toDateUtc && st.Stay.DepartureDate.Date >= fromDateUtc) // Overlapping stays
            .Where(st => st.Stay.State != StayState.Canceled)
            .Select(st => new
            {
                st.ServiceId,
                ServiceName = st.Service.Name,
                st.Price,
                st.Stay.ArrivalDate,
                st.Stay.DepartureDate,
                st.StayId
            })
            .ToListAsync();

        // Calculate all services with usage count and income (not just top services)
        var allServices = serviceTickets
            .GroupBy(st => new { st.ServiceId, st.ServiceName })
            .Select(g => new TopServiceDto(
                g.Key.ServiceName,
                g.Count(),
                g.Sum(st => st.Price)
            ))
            .OrderByDescending(ts => ts.Count)
            .ThenByDescending(ts => ts.Income)
            .ToList();

        // Calculate average consumption per guest
        var uniqueStaysWithServices = serviceTickets
            .Select(st => st.StayId)
            .Distinct()
            .Count();

        var totalStaysInPeriod = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State != StayState.Canceled)
            .Where(s => s.ArrivalDate.Date >= fromDateUtc && s.ArrivalDate.Date <= toDateUtc)
            .CountAsync();

        var avgConsumptionPerGuest = totalStaysInPeriod > 0 
            ? Math.Round((decimal)uniqueStaysWithServices / totalStaysInPeriod, 2)
            : 0;

        // Calculate daily service income with distribution across stay duration
        // Initialize dictionary with all dates in range to ensure complete data
        var dailyServiceIncomeDict = new Dictionary<DateTime, decimal>();
        for (var date = fromDateUtc; date <= toDateUtc; date = date.AddDays(1))
        {
            dailyServiceIncomeDict[date] = 0;
        }

        // Group service tickets by stay to distribute service income across stay duration
        var servicesByStay = serviceTickets
            .GroupBy(st => new { st.StayId, st.ArrivalDate, st.DepartureDate })
            .ToList();

        foreach (var stayGroup in servicesByStay)
        {
            var stayStart = stayGroup.Key.ArrivalDate.Date > fromDateUtc ? stayGroup.Key.ArrivalDate.Date : fromDateUtc;
            var stayEnd = stayGroup.Key.DepartureDate.Date < toDateUtc ? stayGroup.Key.DepartureDate.Date : toDateUtc;
            
            var totalStayServiceIncome = stayGroup.Sum(st => st.Price);
            var totalStayDays = (stayGroup.Key.DepartureDate.Date - stayGroup.Key.ArrivalDate.Date).Days;
            if (totalStayDays <= 0) totalStayDays = 1; // Minimum 1 day
            
            var dailyServiceIncomePerDay = totalStayServiceIncome / totalStayDays;
            
            // Distribute service income across each day of the stay within the query range
            for (var date = stayStart; date <= stayEnd; date = date.AddDays(1))
            {
                dailyServiceIncomeDict[date] += dailyServiceIncomePerDay;
            }
        }

        // Convert to ordered list
        var dailyServiceIncome = dailyServiceIncomeDict
            .Select(kvp => new DailyServiceIncomeDto(kvp.Key, Math.Round(kvp.Value, 2)))
            .OrderBy(d => d.Date)
            .ToList();

        return new ServicesAnalyticsDto(allServices, avgConsumptionPerGuest, dailyServiceIncome);
    }

    public async Task<RoomsAnalyticsDto> GetRoomsAnalyticsAsync(DateTime fromDate, DateTime toDate)
    {
        var tenantId = GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Cannot get rooms analytics without tenant ID");
            return new RoomsAnalyticsDto(
                new RoomStatusTodayDto(0, 0, 0),
                new List<RoomRotationDto>()
            );
        }
        
        // Ensure dates are in UTC for proper comparison
        var fromDateUtc = DateTime.SpecifyKind(fromDate.Date, DateTimeKind.Utc);
        var toDateUtc = DateTime.SpecifyKind(toDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        // Get current room status counts for today
        var today = DateTime.UtcNow.Date;
        var roomStatusCounts = await _context.Rooms
            .Where(r => r.TenantId == tenantId.Value)
            .Where(r => r.IsActive)
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var occupied = roomStatusCounts.FirstOrDefault(r => r.Status == RoomStatus.Occupied)?.Count ?? 0;
        var available = roomStatusCounts.FirstOrDefault(r => r.Status == RoomStatus.Available)?.Count ?? 0;
        var maintenance = roomStatusCounts.FirstOrDefault(r => r.Status == RoomStatus.Maintenance)?.Count ?? 0;

        var roomStatusToday = new RoomStatusTodayDto(occupied, available, maintenance);

        // Calculate room rotation (how many stays each room had in the period) with room type
        // Include room type information for better analytics
        var roomRotationData = await _context.GroupRooms
            .Include(gr => gr.Room)
            .ThenInclude(r => r.RoomType)
            .Include(gr => gr.Stay)
            .Where(gr => gr.TenantId == tenantId.Value)
            .Where(gr => gr.IsActive && gr.Room.IsActive)
            .Where(gr => gr.Stay.State != StayState.Canceled)
            .Where(gr => gr.Stay.ArrivalDate >= fromDateUtc && gr.Stay.ArrivalDate <= toDateUtc)
            .Select(gr => new
            {
                RoomNumber = gr.Room.Number,
                RoomTypeName = gr.Room.RoomType.Name
            })
            .ToListAsync();

        var roomRotation = roomRotationData
            .GroupBy(r => new { r.RoomNumber, r.RoomTypeName })
            .Select(g => new RoomRotationDto(
                g.Key.RoomNumber,
                g.Key.RoomTypeName,
                g.Count()
            ))
            .OrderByDescending(r => r.Stays)
            .ToList();

        return new RoomsAnalyticsDto(roomStatusToday, roomRotation);
    }

    public async Task<GuestsAnalyticsDto> GetGuestsAnalyticsAsync(DateTime fromDate, DateTime toDate)
    {
        var tenantId = GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            _logger.LogWarning("Cannot get guests analytics without tenant ID");
            return new GuestsAnalyticsDto(
                new List<FrequentGuestDto>(),
                new List<LongStayDto>(),
                new List<CityDto>(),
                new List<CountryDto>()
            );
        }
        
        // Ensure dates are in UTC for proper comparison
        var fromDateUtc = DateTime.SpecifyKind(fromDate.Date, DateTimeKind.Utc);
        var toDateUtc = DateTime.SpecifyKind(toDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        // Get frequent guests (guests with most stays in the period)
        var frequentGuestsData = await _context.Stays
            .Include(s => s.Guest)
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State != StayState.Canceled)
            .Where(s => s.ArrivalDate >= fromDateUtc && s.ArrivalDate <= toDateUtc)
            .Select(s => new
            {
                s.Guest.Name,
                s.Guest.LastName
            })
            .ToListAsync();

        var frequentGuests = frequentGuestsData
            .GroupBy(g => new { g.Name, g.LastName })
            .Select(g => new FrequentGuestDto(
                $"{g.Key.Name} {g.Key.LastName.Substring(0, 1)}.",
                g.Count()
            ))
            .OrderByDescending(fg => fg.Stays)
            .Take(10)
            .ToList();

        // Get guests with longest stays in the period
        var longStaysData = await _context.Stays
            .Include(s => s.Guest)
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State != StayState.Canceled)
            .Where(s => s.ArrivalDate >= fromDateUtc && s.ArrivalDate <= toDateUtc)
            .Select(s => new
            {
                s.Guest.Name,
                s.Guest.LastName,
                s.ArrivalDate,
                s.DepartureDate
            })
            .ToListAsync();

        var longStays = longStaysData
            .Select(s => new
            {
                Name = $"{s.Name} {s.LastName.Substring(0, 1)}.",
                Days = (int)(s.DepartureDate - s.ArrivalDate).TotalDays
            })
            .Where(s => s.Days > 0)
            .OrderByDescending(s => s.Days)
            .Take(10)
            .Select(s => new LongStayDto(s.Name, s.Days))
            .ToList();

        // Get all cities of origin (all cities that appear in stays, not just top cities)
        var cityData = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State != StayState.Canceled)
            .Where(s => s.ArrivalDate >= fromDateUtc && s.ArrivalDate <= toDateUtc)
            .Join(_context.Guests.Where(g => g.IsActive),
                stay => stay.HolderId,
                guest => guest.Id,
                (stay, guest) => new { guest.CityId })
            .Join(_context.Cities.Where(c => c.IsActive),
                sg => sg.CityId,
                city => city.Id,
                (sg, city) => city.Name)
            .ToListAsync();

        var allCities = cityData
            .GroupBy(cityName => cityName)
            .Select(g => new CityDto(g.Key, g.Count()))
            .OrderByDescending(tc => tc.Count)
            .ToList();

        // Get all countries of origin (all countries that appear in stays, not just top countries)
        var countryData = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State != StayState.Canceled)
            .Where(s => s.ArrivalDate >= fromDateUtc && s.ArrivalDate <= toDateUtc)
            .Join(_context.Guests.Where(g => g.IsActive),
                stay => stay.HolderId,
                guest => guest.Id,
                (stay, guest) => new { guest.CountryId })
            .Join(_context.Countries.Where(c => c.IsActive),
                sg => sg.CountryId,
                country => country.Id,
                (sg, country) => country.Name)
            .ToListAsync();

        var allCountries = countryData
            .GroupBy(countryName => countryName)
            .Select(g => new CountryDto(g.Key, g.Count()))
            .OrderByDescending(tc => tc.Count)
            .ToList();

        return new GuestsAnalyticsDto(frequentGuests, longStays, allCities, allCountries);
    }

    private static string GetIsoWeekString(DateTime date)
    {
        // ISO 8601 week calculation
        var calendar = CultureInfo.InvariantCulture.Calendar;
        var dayOfWeek = (int)date.DayOfWeek;
        
        // Adjust to make Monday = 0
        var mondayBasedDayOfWeek = (dayOfWeek == 0) ? 6 : dayOfWeek - 1;
        
        // Get the Thursday of this week (ISO week belongs to the year of Thursday)
        var thursday = date.AddDays(3 - mondayBasedDayOfWeek);
        var year = thursday.Year;
        
        // Get the first Thursday of the year
        var jan1 = new DateTime(year, 1, 1);
        var firstMondayOfYear = jan1.AddDays(((8 - (int)jan1.DayOfWeek) % 7));
        var firstThursday = firstMondayOfYear.AddDays(3);
        
        // Calculate week number
        var weekNumber = (int)Math.Ceiling((thursday - firstThursday).TotalDays / 7.0) + 1;
        
        // Handle edge cases
        if (weekNumber < 1)
        {
            year--;
            weekNumber = GetIsoWeekNumber(new DateTime(year, 12, 31));
        }
        else if (weekNumber > 52)
        {
            var nextYearThursday = new DateTime(year + 1, 1, 1).AddDays(3 - (int)new DateTime(year + 1, 1, 1).DayOfWeek);
            if (nextYearThursday.DayOfYear <= 4)
            {
                year++;
                weekNumber = 1;
            }
        }
        
        return $"{year}-W{weekNumber:00}";
    }
    
    private static int GetIsoWeekNumber(DateTime date)
    {
        var dayOfWeek = (int)date.DayOfWeek;
        var mondayBasedDayOfWeek = (dayOfWeek == 0) ? 6 : dayOfWeek - 1;
        var thursday = date.AddDays(3 - mondayBasedDayOfWeek);
        var year = thursday.Year;
        var jan1 = new DateTime(year, 1, 1);
        var firstMondayOfYear = jan1.AddDays(((8 - (int)jan1.DayOfWeek) % 7));
        var firstThursday = firstMondayOfYear.AddDays(3);
        return (int)Math.Ceiling((thursday - firstThursday).TotalDays / 7.0) + 1;
    }
}
