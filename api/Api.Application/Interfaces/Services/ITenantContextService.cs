namespace Api.Application.Interfaces;

public interface ITenantContextService
{
    Guid? GetCurrentTenantId();
    void SetCurrentTenant(Guid tenantId);
    void ClearCurrentTenant();
}
