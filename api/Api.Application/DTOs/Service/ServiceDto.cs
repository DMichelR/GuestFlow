// Api.Application/DTOs/Service/ServiceDto.cs
namespace Api.Application.DTOs.Service;

public class ServiceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = null!;
    public DateTime Created { get; set; }
    public DateTime Updated { get; set; }
}
