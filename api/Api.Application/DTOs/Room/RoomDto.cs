// Api.Application/DTOs/Room/RoomDto.cs
using Api.Domain.Enums;

namespace Api.Application.DTOs.Room;

public class RoomDto
{
    public Guid Id { get; set; }
    public string Number { get; set; } = null!;
    public Guid RoomTypeId { get; set; }
    public string RoomTypeName { get; set; } = null!;
    public decimal RoomTypePrice { get; set; }
    public RoomStatus Status { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = null!;
    public DateTime Created { get; set; }
    public DateTime Updated { get; set; }
}
