using Api.Domain.Entities.Base;

namespace Api.Domain.Entities.Concretes.GuestRelated;

public class Company : BaseTenantEntity
{
    public required string Name { get; set; }
    
}
