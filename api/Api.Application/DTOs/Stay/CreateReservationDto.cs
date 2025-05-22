// Api.Application/DTOs/Stay/CreateReservationDto.cs
using Api.Domain.Enums;

namespace Api.Application.DTOs.Stay;

public class CreateReservationDto
{
    public required Guid VisitReasonId { get; set; }
    public required Guid HolderId { get; set; }
    public required DateTime ArrivalDate { get; set; }
    public required DateTime DepartureDate { get; set; }
    public required int Pax { get; set; }
    public decimal? FinalPrice { get; set; }
    public string? Notes { get; set; }
    public StayState State { get; set; } = StayState.Pending;
    public Guid? CompanyId { get; set; }
    public List<Guid> RoomIds { get; set; } = new();
    public List<Guid> GuestIds { get; set; } = new();
}
