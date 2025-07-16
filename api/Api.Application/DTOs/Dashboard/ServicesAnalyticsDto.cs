namespace Api.Application.DTOs.Dashboard;

public record ServicesAnalyticsDto(
    IEnumerable<TopServiceDto> TopServices,
    decimal AvgConsumptionPerGuest,
    IEnumerable<DailyServiceIncomeDto> IncomeByDay
);

public record TopServiceDto(
    string Name,
    int Count,
    decimal Income
);

public record DailyServiceIncomeDto(
    DateTime Date,
    decimal Income
);
