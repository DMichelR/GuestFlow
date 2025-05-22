// Api.Domain/Extensions/GuestExtensions.cs
using Api.Domain.Entities.Concretes.GuestRelated;

namespace Api.Domain.Extensions;

public static class GuestExtensions
{
    public static string FullName(this Guest guest)
    {
        if (guest == null) return string.Empty;
        return $"{guest.Name} {guest.LastName}".Trim();
    }
}
