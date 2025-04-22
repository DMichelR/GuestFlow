using Api.Domain.Entities.Interface;

namespace Api.Domain.Entities.Base;

public class BaseTenantEntity : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    
    public required Tenant Tenant { get; set; }

    protected void SetTenant(Guid tenantId)
    {
        TenantId = tenantId;
    }
    
    
}
