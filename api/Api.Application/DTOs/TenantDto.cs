namespace Api.Application.DTOs;

public record TenantDto(
    Guid Id, 
    string Name, 
    string? Address, 
    Guid? CountryId,
    Guid? CityId,
    string? CountryName,
    string? CityName,
    bool IsActive,
    DateTime Created, 
    DateTime Updated
);

public record CreateTenantDto(
    string Name, 
    string? Address = null, 
    Guid? CountryId = null, 
    Guid? CityId = null
);

public record UpdateTenantDto(
    string? Name = null, 
    string? Address = null, 
    Guid? CountryId = null, 
    Guid? CityId = null,
    bool? IsActive = null
);
