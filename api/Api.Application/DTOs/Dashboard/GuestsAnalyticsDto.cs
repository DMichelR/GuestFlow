namespace Api.Application.DTOs.Dashboard;

public record GuestsAnalyticsDto(
    IEnumerable<FrequentGuestDto> FrequentGuests,
    IEnumerable<LongStayDto> LongStays,
    IEnumerable<GuestsByCityDto> Cities,
    IEnumerable<GuestsByCountryDto> Countries
);

public record FrequentGuestDto(
    string Name,
    int Stays
);

public record LongStayDto(
    string Name,
    int Days
);

public record GuestsByCityDto(
    string City,
    int Count
);

public record GuestsByCountryDto(
    string Country,
    int Count
);
