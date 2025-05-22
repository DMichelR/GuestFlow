// Api.Application/DTOs/Room/RoomTypeDto.cs
namespace Api.Application.DTOs.Room;

public class RoomTypeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = null!;
    public DateTime Created { get; set; }
    public DateTime Updated { get; set; }
}
