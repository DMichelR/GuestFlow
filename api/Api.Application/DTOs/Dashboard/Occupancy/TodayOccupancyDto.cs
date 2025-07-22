namespace Api.Application.DTOs.Dashboard.Occupancy;

public record TodayOccupancyDto(
    DateTime Date,
    int TotalRooms,
    int OccupiedRooms,
    decimal OccupancyPercentage,
    IEnumerable<string> Recommendations
);
