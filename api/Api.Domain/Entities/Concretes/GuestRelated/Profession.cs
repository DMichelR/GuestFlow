using Api.Domain.Entities.Base;

namespace Api.Domain.Entities.Concretes.GuestRelated;

public class Profession : BaseTenantEntity
{
    public required string Name { get; set; }

}
