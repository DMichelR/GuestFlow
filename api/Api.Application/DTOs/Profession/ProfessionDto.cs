using System;

namespace Api.Application.DTOs.Profession;

public class ProfessionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public Guid TenantId { get; set; }
}
