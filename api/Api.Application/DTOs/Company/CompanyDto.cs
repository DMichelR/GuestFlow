namespace Api.Application.DTOs.Company;

public class CompanyDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    
    public string Name { get; set; } = string.Empty;
    
    public DateTime Created { get; set; }
    public DateTime? Updated { get; set; }
}
