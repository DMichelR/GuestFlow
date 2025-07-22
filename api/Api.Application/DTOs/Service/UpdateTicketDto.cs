// Api.Application/DTOs/Service/UpdateTicketDto.cs
namespace Api.Application.DTOs.Service;

public class UpdateTicketDto
{
    public Guid? ServiceId { get; set; }
    public Guid? UserId { get; set; }
    public decimal? Price { get; set; }
    public string? Notes { get; set; }
}
