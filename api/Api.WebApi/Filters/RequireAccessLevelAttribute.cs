// Api.WebApi/Filters/RequireAccessLevelAttribute.cs
using Api.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Linq;

namespace Api.WebApi.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public class RequireAccessLevelAttribute : TypeFilterAttribute
{
    public RequireAccessLevelAttribute(AccessLevel minimumAccessLevel) 
        : base(typeof(RequireAccessLevelFilter))
    {
        Arguments = new object[] { minimumAccessLevel };
    }
}

public class RequireAccessLevelFilter : IAuthorizationFilter
{
    private readonly AccessLevel _minimumAccessLevel;

    public RequireAccessLevelFilter(AccessLevel minimumAccessLevel)
    {
        _minimumAccessLevel = minimumAccessLevel;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // Check if user is authenticated
        if (!context.HttpContext.User.Identity?.IsAuthenticated ?? false)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Get access level from claims (set by Clerk middleware)
        var accessLevelClaim = context.HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == "AccessLevel");

        if (accessLevelClaim == null)
        {
            Console.WriteLine("AccessLevel claim not found.");
            context.Result = new ForbidResult();
            return;
        }

        if (!Enum.TryParse<AccessLevel>(accessLevelClaim.Value, out var userAccessLevel) 
            || userAccessLevel < _minimumAccessLevel)
        {
            Console.WriteLine($"User access level {userAccessLevel} is lower than required {_minimumAccessLevel}.");
            context.Result = new ForbidResult();
            return;
        }
    }
}
