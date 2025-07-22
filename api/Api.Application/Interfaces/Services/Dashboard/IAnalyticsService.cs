using Api.Application.DTOs.Dashboard;

namespace Api.Application.Interfaces.Services.Dashboard;

public interface IAnalyticsService
{
    /// <summary>
    /// Gets daily income and cancellation statistics for a date range
    /// </summary>
    Task<IncomeAndCancellationsDto> GetIncomeAndCancellationsAsync(DateTime fromDate, DateTime toDate);
    
    /// <summary>
    /// Gets future reservations grouped by week for a date range
    /// </summary>
    Task<FutureReservationsDto> GetFutureReservationsAsync(DateTime futureFrom, DateTime futureTo);
    
    /// <summary>
    /// Gets services analytics including top services, average consumption, and daily income
    /// </summary>
    Task<ServicesAnalyticsDto> GetServicesAnalyticsAsync(DateTime fromDate, DateTime toDate);
    
    /// <summary>
    /// Gets rooms analytics including current status, rotation, and maintenance durations
    /// </summary>
    Task<RoomsAnalyticsDto> GetRoomsAnalyticsAsync(DateTime fromDate, DateTime toDate);
    
    /// <summary>
    /// Gets guests analytics including frequent guests, long stays, and geographic data
    /// </summary>
    Task<GuestsAnalyticsDto> GetGuestsAnalyticsAsync(DateTime fromDate, DateTime toDate);
}
