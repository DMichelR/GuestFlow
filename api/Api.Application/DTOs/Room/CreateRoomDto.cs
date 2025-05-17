// Api.Application/DTOs/Room/CreateRoomDto.cs
using Api.Domain.Enums;

namespace Api.Application.DTOs.Room;

public class CreateRoomDto
{
    public required string Number { get; set; }
    public required Guid RoomTypeId { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Available;
}
