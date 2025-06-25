using System;
using System.ComponentModel.DataAnnotations;

namespace Api.Application.DTOs.City;

public class CreateCityDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;
}
