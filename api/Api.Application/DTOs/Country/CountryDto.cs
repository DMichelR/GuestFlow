using System;

namespace Api.Application.DTOs.Country;

public class CountryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
}
