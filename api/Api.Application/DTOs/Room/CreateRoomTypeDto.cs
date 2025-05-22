// Api.Application/DTOs/Room/CreateRoomTypeDto.cs
namespace Api.Application.DTOs.Room;

public class CreateRoomTypeDto
{
    public required string Name { get; set; }
    public decimal Price { get; set; }
}
