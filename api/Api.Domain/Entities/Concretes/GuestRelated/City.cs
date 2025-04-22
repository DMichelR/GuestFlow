using Api.Domain.Entities.Base;

namespace Api.Domain.Entities.Concretes.GuestRelated;

public class City : BaseEntity
{
    public required string Name { get; set; }
    
}
