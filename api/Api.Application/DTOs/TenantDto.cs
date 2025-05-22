namespace Api.Application.DTOs;

public record TenantDto(Guid Id, string Name, DateTime Created, DateTime Updated);
public record CreateTenantDto(string Name);
public record UpdateTenantDto(string Name);
