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

        // Buscar el claim de metadata que contiene el tenant ID
        var metadataClaim = userClaims.FirstOrDefault(c => c.Type == "metadata");
        if (metadataClaim == null)
        {
            _logger.LogWarning("Metadata claim not found in user claims");
            return null;
        }

        try
        {
            // Deserializar el JSON del claim metadata
            var metadata = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(metadataClaim.Value);
            
            if (metadata == null || !metadata.ContainsKey("tenantId"))
            {
                _logger.LogWarning("TenantId not found in metadata claim");
                return null;
            }

            // Extraer el tenantId del objeto metadata
            var tenantIdStr = metadata["tenantId"]?.ToString();
            
            if (string.IsNullOrEmpty(tenantIdStr))
            {
                _logger.LogWarning("TenantId is null or empty in metadata claim");
                return null;
            }

            if (!Guid.TryParse(tenantIdStr, out var tenantId))
            {
                _logger.LogWarning("Could not parse tenant ID '{TenantId}' from claim", tenantIdStr);
                return null;
            }

            return tenantId;
        }
        catch (System.Text.Json.JsonException ex)
        {
            _logger.LogError(ex, "Error deserializing metadata claim");
            return null;
        }
    }
}