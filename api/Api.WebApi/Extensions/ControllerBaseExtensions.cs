using Microsoft.AspNetCore.Mvc;
using System;

namespace Api.WebApi.Extensions
{
    public static class ControllerBaseExtensions
    {
        /// <summary>
        /// Extrae el tenantId del claim del token JWT
        /// </summary>
        /// <param name="controller">Instancia de ControllerBase</param>
        /// <param name="tenantId">El Guid del tenant extraído (output)</param>
        /// <returns>True si el tenantId se extrajo correctamente, False en caso contrario</returns>
        public static bool TryGetTenantIdFromClaims(this ControllerBase controller, out Guid tenantId)
        {
            tenantId = Guid.Empty;
            var tenantIdClaim = controller.User.FindFirst("TenantId")?.Value;
            
            if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out tenantId))
            {
                return false;
            }
            
            return true;
        }

        /// <summary>
        /// Extrae el tenantId del claim del token JWT y devuelve un BadRequest si no es válido
        /// </summary>
        /// <param name="controller">Instancia de ControllerBase</param>
        /// <param name="tenantId">El Guid del tenant extraído (output)</param>
        /// <returns>ActionResult en caso de error, null si todo está bien</returns>
        public static ActionResult? GetTenantIdOrBadRequest(this ControllerBase controller, out Guid tenantId)
        {
            if (!controller.TryGetTenantIdFromClaims(out tenantId))
            {
                return controller.BadRequest("Invalid or missing tenant ID in the token");
            }
            
            return null;
        }
    }
}