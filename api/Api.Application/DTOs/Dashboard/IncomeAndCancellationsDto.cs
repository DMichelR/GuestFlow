namespace Api.Application.DTOs.Dashboard;

public record IncomeAndCancellationsDto(
    IEnumerable<DailyIncomeDto> IncomeDaily,
    CancelStatsDto CancelStats,
    decimal HistoricalCancellationPercentage,
    IEnumerable<VisitReasonCancellationDto> VisitReasonCancellations
);

public record DailyIncomeDto(
    DateTime Date,
    decimal Total
);

public record CancelStatsDto(
    int Count,
    decimal Percentage
);

public record VisitReasonCancellationDto(
    string VisitReasonName,
    int CancelledCount
);
