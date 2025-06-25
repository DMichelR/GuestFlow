// Api.Application/DTOs/Service/TicketDto.cs
namespace Api.Application.DTOs.Service;

public class TicketDto
{
    public Guid Id { get; set; }
    public Guid StayId { get; set; }
    public string StayReservationNumber { get; set; } = null!;
    public Guid ServiceId { get; set; }
    public string ServiceName { get; set; } = null!;
    public Guid UserId { get; set; }
    public string UserName { get; set; } = null!;
    public decimal Price { get; set; }
    public string? Notes { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = null!;
    public DateTime Created { get; set; }
    public DateTime Updated { get; set; }
}
