using Api.Application.DTOs.Dashboard.Occupancy;
using Api.Application.Interfaces.DataBase;
using Api.Application.Interfaces.Services;
using Api.Application.Interfaces.Services.Dashboard;
using Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Services.Application.Dashboard;

public class OccupancyService : Api.Application.Interfaces.Services.Dashboard.IOccupancyService
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtContextService _jwtContextService;

    public OccupancyService(IApplicationDbContext context, IJwtContextService jwtContextService)
    {
        _context = context;
        _jwtContextService = jwtContextService;
    }

    private Guid? GetCurrentTenantId()
    {
        var tenantId = _jwtContextService.GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            // Note: No logging here since OccupancyService doesn't have a logger injected
            // Following the pattern from RoomService where some services don't log this warning
        }
        return tenantId;
    }

    public async Task<OccupancyReportDto> GetOccupancyReportAsync(DateTime fromDate, DateTime toDate)
    {
        // Ensure dates are in UTC
        fromDate = DateTime.SpecifyKind(fromDate, DateTimeKind.Utc);
        toDate = DateTime.SpecifyKind(toDate, DateTimeKind.Utc);

        var totalRooms = await GetTotalRoomsAsync();
        
        if (totalRooms == 0)
        {
            return new OccupancyReportDto(0, new List<MonthlyOccupancyDto>(), new List<string>());
        }

        // Generate list of months between fromDate and toDate
        var months = GetMonthsBetweenDates(fromDate, toDate);
        var monthlyOccupancy = new List<MonthlyOccupancyDto>();

        foreach (var month in months)
        {
            var monthStart = new DateTime(month.Year, month.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            // Calculate average occupancy for this month
            var averageOccupancy = await CalculateMonthlyAverageOccupancy(monthStart, monthEnd, totalRooms);

            var monthName = GetSpanishMonthName(month.Month);
            
            monthlyOccupancy.Add(new MonthlyOccupancyDto(
                month.Year,
                month.Month,
                monthName,
                Math.Round(averageOccupancy, 2)
            ));
        }

        // Generate recommendations
        var recommendations = GenerateOccupancyRecommendations(monthlyOccupancy);

        return new OccupancyReportDto(totalRooms, monthlyOccupancy, recommendations);
    }

    public async Task<decimal> GetTodayOccupancyAsync()
    {
        var today = DateTime.UtcNow.Date;
        var totalRooms = await GetTotalRoomsAsync();
        
        if (totalRooms == 0) return 0;

        var occupiedRooms = await GetOccupiedRoomsForDate(today);
        return Math.Round((decimal)occupiedRooms / totalRooms * 100, 2);
    }

    public async Task<decimal> GetHistoricalAverageOccupancyAsync()
    {
        var totalRooms = await GetTotalRoomsAsync();
        if (totalRooms == 0) return 0;

        // Get first stay date
        var tenantId = GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            return 0;
        }
        var firstStayDate = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State == StayState.Active || s.State == StayState.Completed)
            .OrderBy(s => s.ArrivalDate)
            .Select(s => s.ArrivalDate.Date)
            .FirstOrDefaultAsync();

        if (firstStayDate == default) return 0;

        var today = DateTime.UtcNow.Date;
        var totalDays = (today - firstStayDate).Days + 1;
        var totalOccupancyPercentage = 0m;

        // Calculate occupancy for each day since first stay
        for (var date = firstStayDate; date <= today; date = date.AddDays(1))
        {
            var occupiedRooms = await GetOccupiedRoomsForDate(date);
            var occupancyPercentage = (decimal)occupiedRooms / totalRooms * 100;
            totalOccupancyPercentage += occupancyPercentage;
        }

        return Math.Round(totalOccupancyPercentage / totalDays, 2);
    }

    public async Task<int> GetTotalRoomsAsync()
    {
        var tenantId = GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            return 0;
        }
        
        // Debug: Check total rooms without filtering by IsActive
        var totalRoomsForTenant = await _context.Rooms.Where(r => r.TenantId == tenantId.Value).CountAsync();
        
        // Debug: Check active rooms
        var activeRoomsForTenant = await _context.Rooms
            .Where(r => r.TenantId == tenantId.Value && r.IsActive)
            .CountAsync();
            
        // For now, let's log both values to understand the issue
        Console.WriteLine($"[OccupancyService] Total rooms for tenant {tenantId.Value}: {totalRoomsForTenant}");
        Console.WriteLine($"[OccupancyService] Active rooms for tenant {tenantId.Value}: {activeRoomsForTenant}");
        
        // Return only active rooms (this is likely what should be counted)
        return activeRoomsForTenant;
    }

    public async Task<DateTime?> GetFirstStayDateAsync()
    {
        var tenantId = GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            return null;
        }
        
        // Debug: Check total stays for this tenant
        var totalStaysForTenant = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .CountAsync();
            
        var activeOrCompletedStaysForTenant = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State == StayState.Active || s.State == StayState.Completed)
            .CountAsync();
            
        Console.WriteLine($"[OccupancyService] Total stays for tenant {tenantId.Value}: {totalStaysForTenant}");
        Console.WriteLine($"[OccupancyService] Active/Completed stays for tenant {tenantId.Value}: {activeOrCompletedStaysForTenant}");
        
        var firstStayDate = await _context.Stays
            .Where(s => s.TenantId == tenantId.Value)
            .Where(s => s.State == StayState.Active || s.State == StayState.Completed)
            .OrderBy(s => s.ArrivalDate)
            .Select(s => s.ArrivalDate.Date)
            .FirstOrDefaultAsync();
            
        Console.WriteLine($"[OccupancyService] First stay date for tenant {tenantId.Value}: {firstStayDate}");
        
        return firstStayDate;
    }

    public List<string> GenerateTodayRecommendations(decimal occupancyPercentage)
    {
        var recommendations = new List<string>();

        if (occupancyPercentage == 0)
        {
            recommendations.Add("⚠️ No tienes huéspedes hoy. Considera promociones de último momento o revisar tu estrategia de precios.");
        }
        else if (occupancyPercentage < 30)
        {
            recommendations.Add("La ocupación de hoy es baja. Considera ofrecer descuentos para atraer huéspedes de último momento.");
        }
        else if (occupancyPercentage < 60)
        {
            recommendations.Add("Ocupación moderada hoy. Podrías promocionar servicios adicionales a los huéspedes actuales.");
        }
        else if (occupancyPercentage < 85)
        {
            recommendations.Add("¡Buena ocupación hoy! Mantén el excelente servicio para asegurar reseñas positivas.");
        }
        else if (occupancyPercentage < 100)
        {
            recommendations.Add("¡Excelente ocupación hoy! Considera esta demanda para ajustar precios futuros.");
        }
        else
        {
            recommendations.Add("🎉 ¡Hotel completamente lleno! Excelente trabajo. Asegúrate de brindar un servicio excepcional.");
        }

        return recommendations;
    }

    public List<string> GenerateHistoricalRecommendations(decimal averageOccupancy)
    {
        var recommendations = new List<string>();

        if (averageOccupancy < 30)
        {
            recommendations.Add("Tu promedio histórico es bajo. Es fundamental revisar tu estrategia de marketing, precios y presencia online.");
        }
        else if (averageOccupancy < 50)
        {
            recommendations.Add("Tu promedio histórico está por debajo del estándar. Considera mejorar tu marketing digital y optimizar precios.");
        }
        else if (averageOccupancy < 70)
        {
            recommendations.Add("Tu promedio histórico es aceptable, pero hay margen de mejora. Enfócate en la retención de clientes y marketing dirigido.");
        }
        else if (averageOccupancy < 85)
        {
            recommendations.Add("¡Buen promedio histórico! Mantén las estrategias actuales y busca oportunidades de crecimiento.");
        }
        else
        {
            recommendations.Add("🎉 ¡Excelente promedio histórico! Tu hotel tiene un rendimiento superior al estándar de la industria.");
        }

        return recommendations;
    }

    private async Task<decimal> CalculateMonthlyAverageOccupancy(DateTime monthStart, DateTime monthEnd, int totalRooms)
    {
        var daysInMonth = (monthEnd - monthStart).Days + 1;
        var totalOccupancyPercentage = 0m;

        // Calculate occupancy for each day in the month
        for (var date = monthStart; date <= monthEnd; date = date.AddDays(1))
        {
            var occupiedRooms = await GetOccupiedRoomsForDate(date);
            var occupancyPercentage = totalRooms > 0 ? (decimal)occupiedRooms / totalRooms * 100 : 0;
            totalOccupancyPercentage += occupancyPercentage;
        }

        // Return average occupancy for the month
        return daysInMonth > 0 ? totalOccupancyPercentage / daysInMonth : 0;
    }

    private async Task<int> GetOccupiedRoomsForDate(DateTime date)
    {
        // Get all stays that are active or completed and overlap with the given date
        var tenantId = GetCurrentTenantId();
        if (!tenantId.HasValue)
        {
            return 0;
        }
        
        // Debug: Check total GroupRooms for this tenant
        var totalGroupRoomsForTenant = await _context.GroupRooms
            .Where(gr => gr.TenantId == tenantId.Value)
            .CountAsync();
            
        Console.WriteLine($"[OccupancyService] Total GroupRooms for tenant {tenantId.Value}: {totalGroupRoomsForTenant}");
        
        var occupiedRoomIds = await _context.GroupRooms
            .Where(gr => gr.TenantId == tenantId.Value)
            .Where(gr => gr.Stay.State == StayState.Active || gr.Stay.State == StayState.Completed)
            .Where(gr => gr.Stay.ArrivalDate <= date && gr.Stay.DepartureDate >= date)
            .Select(gr => gr.RoomId)
            .Distinct()
            .CountAsync();

        Console.WriteLine($"[OccupancyService] Occupied rooms for date {date:yyyy-MM-dd} and tenant {tenantId.Value}: {occupiedRoomIds}");

        return occupiedRoomIds;
    }

    private static List<(int Year, int Month)> GetMonthsBetweenDates(DateTime fromDate, DateTime toDate)
    {
        var months = new List<(int Year, int Month)>();
        var current = new DateTime(fromDate.Year, fromDate.Month, 1);
        var end = new DateTime(toDate.Year, toDate.Month, 1);

        while (current <= end)
        {
            months.Add((current.Year, current.Month));
            current = current.AddMonths(1);
        }

        return months;
    }

    private static List<string> GenerateOccupancyRecommendations(IEnumerable<MonthlyOccupancyDto> monthlyOccupancy)
    {
        var recommendations = new List<string>();
        var monthlyData = monthlyOccupancy.ToList();

        // Low occupancy months (less than 40%)
        var lowOccupancyMonths = monthlyData
            .Where(m => m.AverageOccupancyPercentage < 40)
            .ToList();

        if (lowOccupancyMonths.Any())
        {
            var monthNames = lowOccupancyMonths.Select(m => m.MonthName).ToList();
            if (monthNames.Count == 1)
            {
                recommendations.Add($"En el mes de {monthNames[0]} tienes un promedio menor al 40% de ocupación, así que deberías realizar más actividades promocionales ese mes.");
            }
            else
            {
                var monthList = string.Join(", ", monthNames.Take(monthNames.Count - 1)) + " y " + monthNames.Last();
                recommendations.Add($"En los meses de {monthList} tienes un promedio menor al 40% de ocupación, así que deberías realizar más actividades promocionales esos meses.");
            }
        }

        // High occupancy months (more than 85%)
        var highOccupancyMonths = monthlyData
            .Where(m => m.AverageOccupancyPercentage > 85)
            .ToList();

        if (highOccupancyMonths.Any())
        {
            var monthNames = highOccupancyMonths.Select(m => m.MonthName).ToList();
            if (monthNames.Count == 1)
            {
                recommendations.Add($"¡Excelente! En {monthNames[0]} tienes una ocupación mayor al 85%. Considera aumentar las tarifas durante este periodo de alta demanda.");
            }
            else
            {
                var monthList = string.Join(", ", monthNames.Take(monthNames.Count - 1)) + " y " + monthNames.Last();
                recommendations.Add($"¡Excelente! En {monthList} tienes una ocupación mayor al 85%. Considera aumentar las tarifas durante estos periodos de alta demanda.");
            }
        }

        // Moderate occupancy (40-60%)
        var moderateOccupancyMonths = monthlyData
            .Where(m => m.AverageOccupancyPercentage >= 40 && m.AverageOccupancyPercentage <= 60)
            .ToList();

        if (moderateOccupancyMonths.Any() && moderateOccupancyMonths.Count >= 3)
        {
            recommendations.Add("Tienes varios meses con ocupación moderada (40-60%). Considera implementar estrategias de marketing dirigido para mejorar estos periodos.");
        }

        // Very low occupancy (less than 20%)
        var veryLowOccupancyMonths = monthlyData
            .Where(m => m.AverageOccupancyPercentage < 20)
            .ToList();

        if (veryLowOccupancyMonths.Any())
        {
            recommendations.Add("⚠️ Atención: Tienes meses con ocupación muy baja (menos del 20%). Es urgente revisar tu estrategia de precios y marketing.");
        }

        // Consistent growth pattern
        if (monthlyData.Count >= 3)
        {
            var isGrowing = true;
            for (int i = 1; i < monthlyData.Count; i++)
            {
                if (monthlyData[i].AverageOccupancyPercentage < monthlyData[i - 1].AverageOccupancyPercentage)
                {
                    isGrowing = false;
                    break;
                }
            }

            if (isGrowing)
            {
                recommendations.Add("🎉 ¡Felicitaciones! Tu ocupación muestra una tendencia de crecimiento constante. Mantén las estrategias actuales.");
            }
        }

        // Overall average recommendation
        var overallAverage = monthlyData.Average(m => m.AverageOccupancyPercentage);
        if (overallAverage < 50)
        {
            recommendations.Add($"Tu promedio general de ocupación es del {overallAverage:F1}%. Considera revisar tus precios, mejorar tu presencia online y optimizar tu estrategia de reservas.");
        }
        else if (overallAverage > 75)
        {
            recommendations.Add($"¡Excelente trabajo! Tu promedio general de ocupación es del {overallAverage:F1}%, que está por encima del estándar de la industria.");
        }

        return recommendations;
    }

    private static string GetSpanishMonthName(int month)
    {
        return month switch
        {
            1 => "Enero",
            2 => "Febrero", 
            3 => "Marzo",
            4 => "Abril",
            5 => "Mayo",
            6 => "Junio",
            7 => "Julio",
            8 => "Agosto",
            9 => "Septiembre",
            10 => "Octubre",
            11 => "Noviembre",
            12 => "Diciembre",
            _ => "Mes desconocido"
        };
    }
}
