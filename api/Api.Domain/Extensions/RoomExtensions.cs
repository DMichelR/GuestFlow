// Api.Domain/Extensions/RoomExtensions.cs
using Api.Domain.Entities.Concretes.RoomRelated;

namespace Api.Domain.Extensions;

public static class RoomExtensions
{
    public static string Name(this Room room)
    {
        if (room == null) return string.Empty;
        return room.Number;
    }
}
