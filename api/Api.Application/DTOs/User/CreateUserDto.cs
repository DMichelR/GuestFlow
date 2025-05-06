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
    public Guid TenantId { get; set; }
    public AccessLevel AccessLevel { get; set; } = AccessLevel.Staff;
}
