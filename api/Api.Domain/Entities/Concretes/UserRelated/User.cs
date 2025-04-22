using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.ServiceRelated;
using Api.Domain.Enums;

namespace Api.Domain.Entities.Concretes.UserRelated;

public class User : BaseTenantEntity
{
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Phone { get; set; }
    
    public AccessLevel AccessLevel { get; set; } = AccessLevel.Staff;
    public ICollection<ServiceTicket> ServiceTickets { get; set; } = new List<ServiceTicket>();
}
