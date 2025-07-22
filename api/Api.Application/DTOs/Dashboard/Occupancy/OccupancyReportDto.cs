namespace Api.Application.DTOs.Dashboard.Occupancy;

public record OccupancyReportDto(
    int TotalRooms,
    IEnumerable<MonthlyOccupancyDto> MonthlyOccupancy,
    IEnumerable<string> Recommendations
);
