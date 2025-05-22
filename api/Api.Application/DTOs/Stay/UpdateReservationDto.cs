// Api.Application/DTOs/Stay/UpdateReservationDto.cs
using Api.Domain.Enums;

namespace Api.Application.DTOs.Stay;

public class UpdateReservationDto
{
    public Guid? VisitReasonId { get; set; }
    public Guid? HolderId { get; set; }
    public DateTime? ArrivalDate { get; set; }
    public DateTime? DepartureDate { get; set; }
    public int? Pax { get; set; }
    public decimal? FinalPrice { get; set; }
    public string? Notes { get; set; }
    public StayState? State { get; set; }
    public Guid? CompanyId { get; set; }
    public List<Guid>? RoomIds { get; set; }
    public List<Guid>? GuestIds { get; set; }
}
