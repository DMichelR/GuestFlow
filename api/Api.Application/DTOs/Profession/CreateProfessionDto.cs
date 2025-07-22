using System;
using System.ComponentModel.DataAnnotations;

namespace Api.Application.DTOs.Profession;

public class CreateProfessionDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;
}
