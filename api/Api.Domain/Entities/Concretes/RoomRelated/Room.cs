using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.StayRelated;
using Api.Domain.Enums;

namespace Api.Domain.Entities.Concretes.RoomRelated;

public class Room : BaseTenantEntity
{
    public required string Number { get; set; }
    public required Guid RoomTypeId { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Available;
    public required RoomType RoomType { get; set; }
    public ICollection<GroupRooms> GroupRooms { get; set; } = new List<GroupRooms>();
}
