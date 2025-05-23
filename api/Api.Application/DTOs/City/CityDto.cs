using System;

namespace Api.Application.DTOs.City;

public class CityDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
}
