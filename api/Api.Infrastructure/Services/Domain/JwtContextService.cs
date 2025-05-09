using Api.Application.Interfaces.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Domain;

public class JwtContextService : IJwtContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<JwtContextService> _logger;

    public JwtContextService(IHttpContextAccessor httpContextAccessor, ILogger<JwtContextService> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public Guid? GetCurrentTenantId()
    {
        if (_httpContextAccessor.HttpContext == null)
        {
            _logger.LogWarning("HttpContext is null when trying to get tenant ID");
            return null;
        }

        var userClaims = _httpContextAccessor.HttpContext.User?.Claims;
        if (userClaims == null)
        {
            _logger.LogWarning("User claims are null when trying to get tenant ID");
            return null;
        }

        // Buscar el claim del tenant ID (considerando posibles variaciones en el nombre)
        var tenantClaim = userClaims.FirstOrDefault(c => c.Type == "TenantId" || c.Type == "tenantId");
        if (tenantClaim == null)
        {
            _logger.LogWarning("TenantId claim not found in user claims");
            return null;
        }

        if (!Guid.TryParse(tenantClaim.Value, out var claimTenantId))
        {
            _logger.LogWarning("Could not parse tenant ID '{TenantId}' from claim", tenantClaim.Value);
            return null;
        }

        return claimTenantId;
    }
}