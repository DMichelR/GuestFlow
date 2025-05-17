// Api.Application/DTOs/Service/CreateServiceDto.cs
namespace Api.Application.DTOs.Service;

public class CreateServiceDto
{
    public required string Name { get; set; }
    public required string Description { get; set; }
}
