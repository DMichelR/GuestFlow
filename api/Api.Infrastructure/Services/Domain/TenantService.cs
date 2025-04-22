using Api.Domain.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Api.Infrastructure.Services.Domain;

public class TenantService : ITenantService
{
    
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid? _currentTenantId;
    private const string TenantHeaderName = "X-TenantId";

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? GetCurrentTenantId()
    {
        // Check if tenant ID has been explicitly set
        if (_currentTenantId.HasValue)
            return _currentTenantId;

        // Try to get it from the HTTP context
        if (_httpContextAccessor.HttpContext != null)
        {
            if (_httpContextAccessor.HttpContext.Request.Headers.TryGetValue(TenantHeaderName, out var tenantIdHeader))
            {
                if (Guid.TryParse(tenantIdHeader, out var tenantId))
                {
                    return tenantId;
                }
            }
            
            // You might also get it from claims if you're using authentication
            var userClaims = _httpContextAccessor.HttpContext.User?.Claims;
            var tenantClaim = userClaims?.FirstOrDefault(c => c.Type == "tenantId");
            if (tenantClaim != null && Guid.TryParse(tenantClaim.Value, out var claimTenantId))
            {
                return claimTenantId;
            }
        }

        return null;
    }

    public void SetCurrentTenant(Guid tenantId)
    {
        _currentTenantId = tenantId;
    }

    public void ClearCurrentTenant()
    {
        _currentTenantId = null;
    }
}
