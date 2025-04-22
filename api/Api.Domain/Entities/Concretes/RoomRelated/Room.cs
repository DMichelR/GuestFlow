using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.StayRelated;

namespace Api.Domain.Entities.Concretes.RoomRelated;

public class Room : BaseTenantEntity
{
    public required string Number { get; set; }
    public required Guid RoomTypeId { get; set; }
    public required Guid RoomStatusId { get; set; }
    
    public required RoomStatus RoomStatus { get; set; }
    public required RoomType RoomType { get; set; }
    public ICollection<GroupRooms> GroupRooms { get; set; } = new List<GroupRooms>();
}
