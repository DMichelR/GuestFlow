namespace Api.Application.DTOs.Guest;

public class CreateGuestDto
{
    public required string Name { get; set; }
    public required string LastName { get; set; }
    public required string Cid { get; set; }
    public required DateTime Birthday { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public required string Address { get; set; }
    
    public Guid? ProfessionId { get; set; }
    public required Guid CityId { get; set; }
    public required Guid CountryId { get; set; }
}
