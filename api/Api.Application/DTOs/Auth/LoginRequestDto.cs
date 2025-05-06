// Api.Application/DTOs/Auth/LoginRequestDto.cs
namespace Api.Application.DTOs.Auth;

public class LoginRequestDto
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}
