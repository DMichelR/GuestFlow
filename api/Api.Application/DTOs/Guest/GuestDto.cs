namespace Api.Application.DTOs.Guest;

public class GuestDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    
    public string Name { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Cid { get; set; } = null!;
    public DateTime Birthday { get; set; }
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string Address { get; set; } = null!;
    
    public Guid? ProfessionId { get; set; }
    public string? ProfessionName { get; set; }
    public Guid CityId { get; set; }
    public string CityName { get; set; } = null!;
    public Guid CountryId { get; set; }
    public string CountryName { get; set; } = null!;
}
