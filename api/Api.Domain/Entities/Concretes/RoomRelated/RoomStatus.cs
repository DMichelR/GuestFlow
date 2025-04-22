using Api.Domain.Entities.Base;

namespace Api.Domain.Entities.Concretes.RoomRelated;

public class RoomStatus: BaseTenantEntity
{
    public required string Name { get; set; }
    
    public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();
}
