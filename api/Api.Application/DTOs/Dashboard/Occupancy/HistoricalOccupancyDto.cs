namespace Api.Application.DTOs.Dashboard.Occupancy;

public record HistoricalOccupancyDto(
    DateTime FirstStayDate,
    DateTime LastCalculationDate,
    int TotalDays,
    decimal AverageOccupancyPercentage,
    int TotalRooms,
    IEnumerable<string> Recommendations
);
