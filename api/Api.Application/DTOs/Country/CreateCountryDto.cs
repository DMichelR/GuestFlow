using System.ComponentModel.DataAnnotations;

namespace Api.Application.DTOs.Country;

public class CreateCountryDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;
}
