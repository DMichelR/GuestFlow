using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.ServiceRelated;

namespace Api.Domain.Entities.Concretes.UserRelated;

public class User : BaseTenantEntity
{
    public required string Cid { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required DateTime Birthday { get; set; }
    public required string Phone { get; set; }
    public required string Password { get; set; }
    
    
    public Guid AccessLevelId { get; set; }
    public required AccessLevel AccessLevel { get; set; }
    public ICollection<ServiceTicket> ServiceTickets { get; set; } = new List<ServiceTicket>();
}
