namespace Api.Application.Interfaces;

public interface ITenantService
{
    Guid? GetCurrentTenantId();
    void SetCurrentTenant(Guid tenantId);
    void ClearCurrentTenant();
}
