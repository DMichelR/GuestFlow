namespace Api.Application.DTOs.Dashboard;

public record GuestsAnalyticsDto(
    IEnumerable<FrequentGuestDto> FrequentGuests,
    IEnumerable<LongStayDto> LongStays,
    IEnumerable<CityDto> Cities,
    IEnumerable<CountryDto> Countries
);

public record FrequentGuestDto(
    string Name,
    int Stays
);

public record LongStayDto(
    string Name,
    int Days
);

public record CityDto(
    string City,
    int Count
);

public record CountryDto(
    string Country,
    int Count
);
