using Api.Application.DTOs;
using Api.Application.DTOs.User;
using Api.Domain.Enums;

namespace Api.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(UserDto user, AccessLevel accessLevel);
}
