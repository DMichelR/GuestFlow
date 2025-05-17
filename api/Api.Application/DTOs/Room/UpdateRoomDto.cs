// Api.Application/DTOs/Room/UpdateRoomDto.cs
using Api.Domain.Enums;

namespace Api.Application.DTOs.Room;

public class UpdateRoomDto
{
    public string? Number { get; set; }
    public Guid? RoomTypeId { get; set; }
    public RoomStatus? Status { get; set; }
}
