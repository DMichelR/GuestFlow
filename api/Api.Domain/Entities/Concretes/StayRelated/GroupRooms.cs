using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.GuestRelated;
using Api.Domain.Entities.Concretes.RoomRelated;

namespace Api.Domain.Entities.Concretes.StayRelated;

public class GroupRooms : BaseTenantEntity
{
    public required Guid RoomId { get; set; }
    public required Guid StayId { get; set; }
    
    public required Room Room { get; set; }
    public required Stay Stay { get; set; }
}
