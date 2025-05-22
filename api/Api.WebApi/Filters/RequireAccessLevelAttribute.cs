// Api.WebApi/Filters/RequireAccessLevelAttribute.cs
using System;
using Api.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Api.WebApi.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequireAccessLevelAttribute : Attribute, IAuthorizationFilter
{
    private readonly AccessLevel _requiredAccessLevel;

    public RequireAccessLevelAttribute(AccessLevel requiredAccessLevel)
    {
        _requiredAccessLevel = requiredAccessLevel;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // Verificar si el usuario está autenticado
        if (!context.HttpContext.User.Identity.IsAuthenticated)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Obtener el nivel de acceso del usuario desde las claims
        var accessLevelClaim = context.HttpContext.User.FindFirst("AccessLevel");
        if (accessLevelClaim == null)
        {
            Console.WriteLine("Access level claim not found.");
            context.Result = new ForbidResult();
            return;
        }

        // Verificar si el nivel de acceso es suficiente
        if (Enum.TryParse<AccessLevel>(accessLevelClaim.Value, out var userAccessLevel))
        {
            // Comparar el nivel de acceso del usuario con el requerido
            // En la enumeración AccessLevel, los niveles más altos deberían tener valores numéricos más altos
            if ((int)userAccessLevel < (int)_requiredAccessLevel)
            {
                Console.WriteLine($"Access denied. Required: {_requiredAccessLevel}, User: {userAccessLevel}");
                context.Result = new ForbidResult();
                return;
            }
        }
        else
        {
            // Si no se puede parsear el nivel de acceso, denegar el acceso
            Console.WriteLine($"Invalid access level claim value: {accessLevelClaim.Value}");
            context.Result = new ForbidResult();
        }
    }
}
