// Api.Application/DTOs/User/CreateUserDto.cs
using Api.Domain.Enums;
using System;

namespace Api.Application.DTOs.User;

public class CreateUserDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public AccessLevel AccessLevel { get; set; } = AccessLevel.Staff;
    public Guid? TenantId { get; set; } // Agregamos TenantId opcional
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Address { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? HireDate { get; set; }
    public string? GovernmentId { get; set; }
    public DateTime? DocumentExpiry { get; set; }
}
