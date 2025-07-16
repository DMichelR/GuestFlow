using Api.Application.DTOs.Dashboard.Occupancy;

namespace Api.Application.Interfaces.Services.Dashboard;

public interface IOccupancyService
{
    /// <summary>
    /// Gets occupancy report for a specific date range with recommendations
    /// </summary>
    Task<OccupancyReportDto> GetOccupancyReportAsync(DateTime fromDate, DateTime toDate);
    
    /// <summary>
    /// Gets current day occupancy percentage
    /// </summary>
    Task<decimal> GetTodayOccupancyAsync();
    
    /// <summary>
    /// Gets historical average occupancy since the first stay
    /// </summary>
    Task<decimal> GetHistoricalAverageOccupancyAsync();
    
    /// <summary>
    /// Gets total number of rooms for the current tenant
    /// </summary>
    Task<int> GetTotalRoomsAsync();
    
    /// <summary>
    /// Gets the first stay date for historical calculations
    /// </summary>
    Task<DateTime?> GetFirstStayDateAsync();
    
    /// <summary>
    /// Generates recommendations for today's occupancy
    /// </summary>
    List<string> GenerateTodayRecommendations(decimal occupancyPercentage);
    
    /// <summary>
    /// Generates recommendations for historical occupancy
    /// </summary>
    List<string> GenerateHistoricalRecommendations(decimal averageOccupancy);
}
