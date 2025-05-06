// Api.Application/DTOs/Auth/LoginResponseDto.cs
using Api.Application.DTOs.User;
using System;

namespace Api.Application.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = null!;
    public UserDto User { get; set; } = null!;
}
