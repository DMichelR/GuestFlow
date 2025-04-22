namespace Api.Domain.Interfaces;

public interface ITenantService
{
    Guid? GetCurrentTenantId();
    void SetCurrentTenant(Guid tenantId);
    void ClearCurrentTenant();
}
