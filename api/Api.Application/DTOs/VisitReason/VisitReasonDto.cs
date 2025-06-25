// Api.Application/DTOs/VisitReason/VisitReasonDto.cs

namespace Api.Application.DTOs.VisitReason;

public class VisitReasonDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public DateTime Created { get; set; }
    public DateTime Updated { get; set; }
}
