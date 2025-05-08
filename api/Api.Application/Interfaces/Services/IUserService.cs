using Api.Application.DTOs;
using Api.Application.DTOs.User;
using Api.Domain.Entities.Concretes.UserRelated;

namespace Api.Application.Interfaces.Services;

public interface IUserService
{
    Task<UserDto> GetByIdAsync(Guid id);
    Task<IEnumerable<UserDto>> GetAllAsync(Guid tenantId);
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<UserDto?> GetByEmailAsync(string email);
}
