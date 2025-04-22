using Api.Domain.Entities.Base;

namespace Api.Domain.Entities.Concretes.UserRelated;

public class AccessLevel: BaseEntity
{
    public required string Name { get; init; }
    
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
