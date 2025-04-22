using System.ComponentModel.DataAnnotations.Schema;
using Api.Domain.Entities.Base;

namespace Api.Domain.Entities.Concretes.RoomRelated;

public class RoomType: BaseTenantEntity
{
    public string Name { get; set; }
    
    [Column(TypeName="money")]
    public decimal Price { get; set; }

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
