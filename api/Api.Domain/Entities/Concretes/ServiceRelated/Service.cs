using Api.Domain.Entities.Base;

namespace Api.Domain.Entities.Concretes.ServiceRelated;

public class Service : BaseTenantEntity
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    
    public ICollection<ServiceTicket> ServiceTickets { get; set; } = new List<ServiceTicket>();
}
