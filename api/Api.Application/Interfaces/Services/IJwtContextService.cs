namespace Api.Application.Interfaces.Services;

public interface IJwtContextService
{
    Guid? GetCurrentTenantId();
}