// Api.WebApi/Middleware/ClerkAuthenticationMiddleware.cs
using Api.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Api.WebApi.Middleware;

public class ClerkAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private static JsonWebKeySet _jsonWebKeySet;
    private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

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

                // Load JWKS if not already loaded
                if (_jsonWebKeySet == null)
                {
                    await _semaphore.WaitAsync();
                    try
                    {
                        if (_jsonWebKeySet == null)
                        {
                            using var httpClient = new HttpClient();
                            var jwksUri = "https://prompt-fowl-38.clerk.accounts.dev/.well-known/jwks.json";
                            var jwksResponse = await httpClient.GetStringAsync(jwksUri);
                            _jsonWebKeySet = new JsonWebKeySet(jwksResponse);
                        }
                    }
                    finally
                    {
                        _semaphore.Release();
                    }
                }

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = "https://prompt-fowl-38.clerk.accounts.dev",
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    IssuerSigningKeys = _jsonWebKeySet.Keys,
                    ValidateIssuerSigningKey = true
                };

                var principal = handler.ValidateToken(token, validationParameters, out _);

                // Read JWT token manually to get to the metadata object
                var jwtToken = handler.ReadJwtToken(token);
                var metadataObject = jwtToken.Claims.FirstOrDefault(c => c.Type == "metadata")?.Value;
                
                if (!string.IsNullOrEmpty(metadataObject))
                {
                    // Try parsing metadata as JSON
                    try 
                    {
                        var metadata = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonDocument>(metadataObject);
                        
                        // Extract role from metadata
                        if (metadata.RootElement.TryGetProperty("role", out var roleElement) && 
                            Enum.TryParse(typeof(AccessLevel), roleElement.GetString(), true, out var accessLevel))
                        {
                            var claimsIdentity = (ClaimsIdentity)principal.Identity;
                            claimsIdentity.AddClaim(new Claim("AccessLevel", accessLevel.ToString()));
                        }
                        
                        // Extract tenantID from metadata
                        if (metadata.RootElement.TryGetProperty("tenantID", out var tenantElement) && 
                            Guid.TryParse(tenantElement.GetString(), out var tenantId))
                        {
                            var claimsIdentity = (ClaimsIdentity)principal.Identity;
                            claimsIdentity.AddClaim(new Claim("TenantId", tenantId.ToString()));
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error parsing metadata JSON: {ex.Message}");
                    }
                }
                else
                {
                    // Fallback to the previous claim extraction logic
                    var metadataRoleClaim = principal.Claims.FirstOrDefault(c => c.Type == "metadata.role")?.Value;
                    if (!string.IsNullOrEmpty(metadataRoleClaim) && 
                        Enum.TryParse(typeof(AccessLevel), metadataRoleClaim, true, out var accessLevel))
                    {
                        var claimsIdentity = (ClaimsIdentity)principal.Identity;
                        claimsIdentity.AddClaim(new Claim("AccessLevel", accessLevel.ToString()));
                    }
                    
                    var tenantIdClaim = principal.Claims.FirstOrDefault(c => c.Type == "metadata.tenantID" || 
                                                                           c.Type == "tenantId")?.Value;
                    if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var tenantId))
                    {
                        var claimsIdentity = (ClaimsIdentity)principal.Identity;
                        claimsIdentity.AddClaim(new Claim("TenantId", tenantId.ToString()));
                    }
                }

                context.User = principal;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation failed: {ex.Message}");
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
