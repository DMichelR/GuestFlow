using System.ComponentModel.DataAnnotations.Schema;
using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.StayRelated;
using Api.Domain.Entities.Concretes.UserRelated;

namespace Api.Domain.Entities.Concretes.ServiceRelated;

public class ServiceTicket : BaseTenantEntity
{
    public required Guid StayId { get; set; }
    public required Guid ServiceId { get; set; }
    public required Guid UserId { get; set; }
    [Column(TypeName="money")]
    public required decimal Price { get; set; }
    public string? Notes { get; set; }
    
    public required Stay Stay { get; set; }
    public required Service Service { get; set; }
    public required User User { get; set; }
}
