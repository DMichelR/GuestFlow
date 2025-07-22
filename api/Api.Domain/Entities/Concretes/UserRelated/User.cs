using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.ServiceRelated;
using Api.Domain.Enums;

namespace Api.Domain.Entities.Concretes.UserRelated;

public class User : BaseTenantEntity
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public required string ClerkId { get; set; }
    
    // Nuevos campos
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Address { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? HireDate { get; set; }
    public string? GovernmentId { get; set; }
    public DateTime? DocumentExpiry { get; set; }
    public bool IsActive { get; set; } = true;
    
    public AccessLevel AccessLevel { get; set; } = AccessLevel.Staff;
    public ICollection<ServiceTicket> ServiceTickets { get; set; } = new List<ServiceTicket>();
}
