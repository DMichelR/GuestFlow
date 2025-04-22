using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.GuestRelated;

namespace Api.Domain.Entities.Concretes.StayRelated;

public class GroupGuests : BaseTenantEntity
{
    public required Guid GuestId { get; set; }
    public required Guid StayId { get; set; }
    
    public required Stay Stay { get; set; }
    public required Guest Guest { get; set; }
}
