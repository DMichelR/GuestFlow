namespace Api.Application.DTOs.Dashboard;

public record FutureReservationsDto(
    IEnumerable<WeeklyReservationsDto> ReservationsByWeek
);

public record WeeklyReservationsDto(
    string Week,
    int Reservations
);
