namespace Api.Application.DTOs.Dashboard.Occupancy;

public record MonthlyOccupancyDto(
    int Year,
    int Month,
    string MonthName,
    decimal AverageOccupancyPercentage
);
