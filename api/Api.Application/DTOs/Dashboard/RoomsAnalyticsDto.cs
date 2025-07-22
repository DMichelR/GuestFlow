namespace Api.Application.DTOs.Dashboard;

public record RoomsAnalyticsDto(
    RoomStatusTodayDto RoomStatusToday,
    IEnumerable<RoomRotationDto> Rotation
);

public record RoomStatusTodayDto(
    int Occupied,
    int Available,
    int Maintenance
);

public record RoomRotationDto(
    string Room,
    string RoomType,
    int Stays
);
