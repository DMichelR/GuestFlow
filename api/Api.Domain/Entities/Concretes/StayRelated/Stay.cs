using System.ComponentModel.DataAnnotations.Schema;
using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.GuestRelated;
using Api.Domain.Entities.Concretes.ServiceRelated;

namespace Api.Domain.Entities.Concretes.StayRelated;

public class Stay : BaseTenantEntity
{
    public required Guid VisitReasonId { get; set; }
    public required Guid HolderId { get; set; }
    public required DateTime ArrivalDate { get; set; }
    public required DateTime DepartureDate { get; set; }
    public DateTime? ReservationDate { get; set; }
    public required int Pax { get; set; }
    [Column(TypeName="money")]
    public decimal? FinalPrice { get; set; }
    public string? Notes { get; set; }
    
    public required VisitReason VisitReason { get; set; }
    public required Guest Guest { get; set; }
    public ICollection<ServiceTicket> ServiceTickets { get; set; } = new List<ServiceTicket>();
    public ICollection<GroupGuests> GroupGuests { get; set; } = new List<GroupGuests>();
    public ICollection<GroupRooms> GroupRooms { get; set; } = new List<GroupRooms>();
}


