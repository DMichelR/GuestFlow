namespace Api.Domain.Entities.Interface;

public interface IEntity
{
    Guid Id { get;}
    DateTime Created { get;}
    DateTime Updated { get; }
}
