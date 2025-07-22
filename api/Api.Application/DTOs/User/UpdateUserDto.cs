// Api.Application/DTOs/User/UpdateUserDto.cs
using Api.Domain.Enums;

namespace Api.Application.DTOs.User;

public class UpdateUserDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public AccessLevel? AccessLevel { get; set; }
    public bool? IsActive { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Address { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? HireDate { get; set; }
    public string? GovernmentId { get; set; }
    public DateTime? DocumentExpiry { get; set; }
}
