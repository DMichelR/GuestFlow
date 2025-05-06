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
}
