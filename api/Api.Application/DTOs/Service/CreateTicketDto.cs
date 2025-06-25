// Api.Application/DTOs/Service/CreateTicketDto.cs
namespace Api.Application.DTOs.Service;

public class CreateTicketDto
{
    public required Guid StayId { get; set; }
    public required Guid ServiceId { get; set; }
    public required Guid UserId { get; set; }
    public required decimal Price { get; set; }
    public string? Notes { get; set; }
}
