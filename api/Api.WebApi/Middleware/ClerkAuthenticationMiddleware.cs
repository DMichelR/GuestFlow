// Api.WebApi/Middleware/ClerkAuthenticationMiddleware.cs
using Microsoft.AspNetCore.Http;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Api.WebApi.Middleware;

public class ClerkAuthenticationMiddleware
{
    private readonly RequestDelegate _next;

    public ClerkAuthenticationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/api/auth") ||
            context.Request.Path.StartsWithSegments("/swagger"))
        {
            await _next(context);
            return;
        }

        var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

        if (token != null)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jsonToken = handler.ReadToken(token) as JwtSecurityToken;

                if (jsonToken != null)
                {
                    var identity = new ClaimsIdentity(jsonToken.Claims, "Clerk");
                    
                    // Add custom claims for access level and tenant if needed
                    context.User = new ClaimsPrincipal(identity);
                }
            }
            catch (Exception)
            {
                // Token was invalid, continue to next middleware
                // The Authorization filter will reject the request if needed
            }
        }

        await _next(context);
    }
}

// Extension methods for using the middleware
public static class ClerkAuthenticationMiddlewareExtensions
{
    public static IApplicationBuilder UseClerkAuthentication(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ClerkAuthenticationMiddleware>();
    }
}
