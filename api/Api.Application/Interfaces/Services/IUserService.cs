using Api.Application.DTOs.User;

namespace Api.Application.Interfaces.Services;

public interface IUserService
{
    Task<UserDto> GetByIdAsync(Guid id);
    Task<IEnumerable<UserDto>> GetAllAsync();
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<UserDto?> GetByEmailAsync(string email);  // Existing methods...
    Task<UserDto?> GetFromClerkAsync(string email);
    Task<UserDto> CreateFromClerkAsync(string clerkUserId, string email, string firstName, string lastName);

}
