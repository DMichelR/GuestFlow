namespace Api.Domain.Entities.Interface;

public interface ITenantEntity : IEntity
{
    Guid TenantId { get; }
}
