// Api.Application/DTOs/User/UserDto.cs
using Api.Domain.Enums;
using System;

namespace Api.Application.DTOs.User;

public class UserDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string ClerkId { get; set; } = null!;
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = null!;
    public AccessLevel AccessLevel { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Address { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? HireDate { get; set; }
    public string? GovernmentId { get; set; }
    public DateTime? DocumentExpiry { get; set; }
    public bool IsActive { get; set; }
    public DateTime Created { get; set; }
    public DateTime? Updated { get; set; }
}
