using Api.Domain.Entities.Base;

namespace Api.Domain.Entities.Concretes.StayRelated;

public class VisitReason : BaseTenantEntity
{
    public required string Name { get; set; }
    public bool IsActive { get; set; } = true;
    
}
