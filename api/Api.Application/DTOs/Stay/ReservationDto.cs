// Api.Application/DTOs/Stay/ReservationDto.cs
using Api.Domain.Enums;

namespace Api.Application.DTOs.Stay;

public class ReservationDto
{
    public Guid Id { get; set; }
    public Guid VisitReasonId { get; set; }
    public string VisitReasonName { get; set; } = string.Empty;
    public Guid HolderId { get; set; }
    public string HolderName { get; set; } = string.Empty;
    public string HolderEmail { get; set; } = string.Empty;
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public DateTime ReservationDate { get; set; }
    public int Pax { get; set; }
    public decimal? FinalPrice { get; set; }
    public string? Notes { get; set; }
    public StayState State { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public List<string> AssignedRooms { get; set; } = new();
    public List<string> Guests { get; set; } = new();
}
