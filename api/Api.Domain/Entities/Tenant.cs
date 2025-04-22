using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.GuestRelated;
using Api.Domain.Entities.Concretes.RoomRelated;
using Api.Domain.Entities.Concretes.ServiceRelated;
using Api.Domain.Entities.Concretes.StayRelated;
using Api.Domain.Entities.Concretes.UserRelated;

namespace Api.Domain.Entities;

public class Tenant : BaseEntity
{
    public required string Name { get; set; }
    
    public virtual ICollection<User>? Users { get; set; }
    public virtual ICollection<Guest>? Guests { get; set; }
    public virtual ICollection<Service>? Services { get; set; }
    public virtual ICollection<ServiceTicket>? ServiceTickets { get; set; }
    public virtual ICollection<Stay>? Stays { get; set; }
    public virtual ICollection<Company>? Companies { get; set; }
    public virtual ICollection<Profession>? Professions { get; set; }
    public virtual ICollection<VisitReason>? VisitReasons { get; set; }
    public virtual ICollection<GroupGuests>? GroupGuests { get; set; }
    public virtual ICollection<GroupRooms>? GroupRooms { get; set; }
    public virtual ICollection<RoomType>? RoomTypes { get; set; }
    public virtual ICollection<Room>? Rooms { get; set; }
    public virtual ICollection<RoomStatus>? RoomStatus { get; set; }
}
