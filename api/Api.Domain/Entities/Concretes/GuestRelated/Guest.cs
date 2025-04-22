using Api.Domain.Entities.Base;
using Api.Domain.Entities.Concretes.StayRelated;

namespace Api.Domain.Entities.Concretes.GuestRelated;

public class Guest : BaseTenantEntity
{
    public required string Name { get; set; }
    public required string LastName { get; set; }
    public required string Cid {get; set;}
    public required DateTime Birthday {get; set;}
    public required string Email {get; set;}
    public required string Phone {get; set;}
    public required string Address {get; set;}
    
    public Guid CompanyId {get; set;}
    public Guid ProfessionId {get; set;}
    public required Guid CityId {get; set;}
    public required Guid CountryId {get; set;}
    
    public Company? Company {get; set;}
    public Profession? Profession {get; set;}
    public required City City {get; set;}
    public required Country Country {get; set;}
    
    public ICollection<Stay> Stays {get; set;} = new List<Stay>();
    public ICollection<GroupGuests> GroupGuests {get; set;} = new List<GroupGuests>();
}
