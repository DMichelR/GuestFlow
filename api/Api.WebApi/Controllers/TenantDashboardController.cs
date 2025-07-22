using Api.Application.DTOs.Dashboard;
using Api.Application.DTOs.Dashboard.Occupancy;
using Api.Application.Interfaces.Services.Dashboard;
using Api.Domain.Enums;
using Api.WebApi.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantDashboardController : ControllerBase
{
    private readonly IOccupancyService _occupancyService;
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<TenantDashboardController> _logger;

    public TenantDashboardController(
        IOccupancyService occupancyService, 
        IAnalyticsService analyticsService,
        ILogger<TenantDashboardController> logger)
    {
        _occupancyService = occupancyService;
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the average occupancy percentage for each month within the specified date range with recommendations.
    /// The calculation includes all days of each month that falls within the range.
    /// </summary>
    /// <param name="fromDate">Start date (yyyy-MM-dd format)</param>
    /// <param name="toDate">End date (yyyy-MM-dd format)</param>
    /// <returns>Occupancy report with total rooms, monthly averages, and recommendations</returns>
    [HttpGet("occupancy")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<OccupancyReportDto>> GetOccupancyReport(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate)
    {
        try
        {
            var report = await _occupancyService.GetOccupancyReportAsync(fromDate, toDate);
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating occupancy report from {FromDate} to {ToDate}", fromDate, toDate);
            return StatusCode(500, "Ocurrió un error al calcular el reporte de ocupación");
        }
    }
    /// <summary>
    /// Gets today's occupancy percentage with recommendations
    /// </summary>
    /// <returns>Today's occupancy data with recommendations</returns>
    [HttpGet("occupancy/today")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<TodayOccupancyDto>> GetTodayOccupancy()
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            var totalRooms = await _occupancyService.GetTotalRoomsAsync();
            var occupancyPercentage = await _occupancyService.GetTodayOccupancyAsync();
            var occupiedRooms = totalRooms > 0 ? (int)Math.Round(occupancyPercentage * totalRooms / 100) : 0;

            var recommendations = _occupancyService.GenerateTodayRecommendations(occupancyPercentage);

            var result = new TodayOccupancyDto(
                today,
                totalRooms,
                occupiedRooms,
                occupancyPercentage,
                recommendations
            );

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating today's occupancy");
            return StatusCode(500, "Ocurrió un error al calcular la ocupación de hoy");
        }
    }

    /// <summary>
    /// Gets historical average occupancy since the first stay with recommendations
    /// </summary>
    /// <returns>Historical occupancy data with recommendations</returns>
    [HttpGet("occupancy/historical")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<HistoricalOccupancyDto>> GetHistoricalOccupancy()
    {
        try
        {
            var totalRooms = await _occupancyService.GetTotalRoomsAsync();
            var averageOccupancy = await _occupancyService.GetHistoricalAverageOccupancyAsync();
            var firstStayDate = await _occupancyService.GetFirstStayDateAsync();
            
            if (!firstStayDate.HasValue)
            {
                var emptyResult = new HistoricalOccupancyDto(
                    DateTime.UtcNow.Date,
                    DateTime.UtcNow.Date,
                    0,
                    0,
                    totalRooms,
                    new List<string> { "No tienes estancias registradas aún. ¡Comienza a recibir huéspedes para ver tus estadísticas!" }
                );
                return Ok(emptyResult);
            }

            var totalDays = (DateTime.UtcNow.Date - firstStayDate.Value).Days + 1;
            var recommendations = _occupancyService.GenerateHistoricalRecommendations(averageOccupancy);

            var result = new HistoricalOccupancyDto(
                firstStayDate.Value,
                DateTime.UtcNow.Date,
                totalDays,
                averageOccupancy,
                totalRooms,
                recommendations
            );

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating historical occupancy");
            return StatusCode(500, "Ocurrió un error al calcular la ocupación histórica");
        }
    }

    /// <summary>
    /// Gets daily income and cancellation statistics for a specific date range, including historical cancellation percentage and historical cancellation reasons by visit type
    /// </summary>
    /// <param name="from">Start date for income and cancellation analysis (yyyy-MM-dd format)</param>
    /// <param name="to">End date for income and cancellation analysis (yyyy-MM-dd format)</param>
    /// <returns>Daily income data, cancellation statistics for the period, historical cancellation percentage, and historical cancellation reasons with counts by visit type (all time)</returns>
    [HttpGet("income-and-cancellations")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<IncomeAndCancellationsDto>> GetIncomeAndCancellations(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        try
        {
            var result = await _analyticsService.GetIncomeAndCancellationsAsync(from, to);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating income and cancellations from {FromDate} to {ToDate}", from, to);
            return StatusCode(500, "Ocurrió un error al calcular los ingresos y cancelaciones");
        }
    }

    /// <summary>
    /// Gets future reservations grouped by week for a specific date range
    /// </summary>
    /// <param name="futureFrom">Start date for future reservations analysis (yyyy-MM-dd format)</param>
    /// <param name="futureTo">End date for future reservations analysis (yyyy-MM-dd format)</param>
    /// <returns>Future reservations grouped by week</returns>
    [HttpGet("future-reservations")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<FutureReservationsDto>> GetFutureReservations(
        [FromQuery] DateTime futureFrom,
        [FromQuery] DateTime futureTo)
    {
        try
        {
            var result = await _analyticsService.GetFutureReservationsAsync(futureFrom, futureTo);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating future reservations from {FutureFromDate} to {FutureToDate}", futureFrom, futureTo);
            return StatusCode(500, "Ocurrió un error al calcular las reservas futuras");
        }
    }

    /// <summary>
    /// Gets services analytics including top services, average consumption per guest, and daily service income
    /// </summary>
    /// <param name="from">Start date for services analysis (yyyy-MM-dd format)</param>
    /// <param name="to">End date for services analysis (yyyy-MM-dd format)</param>
    /// <returns>Services analytics data</returns>
    [HttpGet("analytics/services")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<ServicesAnalyticsDto>> GetServicesAnalytics(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        try
        {
            var result = await _analyticsService.GetServicesAnalyticsAsync(from, to);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating services analytics from {FromDate} to {ToDate}", from, to);
            return StatusCode(500, "Ocurrió un error al calcular las analíticas de servicios");
        }
    }

    /// <summary>
    /// Gets rooms analytics including current status, rotation, and maintenance durations
    /// </summary>
    /// <param name="from">Start date for room rotation analysis (yyyy-MM-dd format)</param>
    /// <param name="to">End date for room rotation analysis (yyyy-MM-dd format)</param>
    /// <returns>Rooms analytics data</returns>
    [HttpGet("analytics/rooms")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<RoomsAnalyticsDto>> GetRoomsAnalytics(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        try
        {
            var result = await _analyticsService.GetRoomsAnalyticsAsync(from, to);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating rooms analytics from {FromDate} to {ToDate}", from, to);
            return StatusCode(500, "Ocurrió un error al calcular las analíticas de habitaciones");
        }
    }

    /// <summary>
    /// Gets guests analytics including frequent guests, long stays, and geographic data
    /// </summary>
    /// <param name="from">Start date for guest analysis (yyyy-MM-dd format)</param>
    /// <param name="to">End date for guest analysis (yyyy-MM-dd format)</param>
    /// <returns>Guests analytics data</returns>
    [HttpGet("analytics/guests")]
    [RequireAccessLevel(AccessLevel.Staff)]
    public async Task<ActionResult<GuestsAnalyticsDto>> GetGuestsAnalytics(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        try
        {
            var result = await _analyticsService.GetGuestsAnalyticsAsync(from, to);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating guests analytics from {FromDate} to {ToDate}", from, to);
            return StatusCode(500, "Ocurrió un error al calcular las analíticas de huéspedes");
        }
    }
}