using Api.Domain.Entities.Interface;

namespace Api.Domain.Entities.Base;

public class BaseEntity : IEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime Created { get; protected set; } = DateTime.UtcNow;
    public DateTime Updated { get; private set; } = DateTime.UtcNow;
    
    
    public void UpdateTimestamp()
    {
        Updated = DateTime.UtcNow;
    }
    
}
