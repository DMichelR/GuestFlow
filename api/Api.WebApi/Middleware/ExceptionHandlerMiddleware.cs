using System.Net;
using System.Text.Json;
using Clerk.BackendAPI.Models.Errors;

namespace Api.WebApi.Middleware;

public class ExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlerMiddleware> _logger;

    public ExceptionHandlerMiddleware(RequestDelegate next, ILogger<ExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "An error occurred: {Message}", exception.Message);

        var statusCode = exception switch
        {
            InvalidOperationException => HttpStatusCode.BadRequest,
            ClerkErrors => HttpStatusCode.BadRequest,
            ArgumentException => HttpStatusCode.BadRequest,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            KeyNotFoundException => HttpStatusCode.NotFound,
            _ => HttpStatusCode.InternalServerError
        };

        var response = new
        {
            status = (int)statusCode,
            error = GetErrorMessage(exception)
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }

    private string GetErrorMessage(Exception exception)
    {
        // Special handling for Clerk errors
        if (exception is ClerkErrors clerkError)
        {
            var errorDetails = clerkError.ToString();
            
            if (errorDetails.Contains("email_address"))
            {
                return "Invalid email format or the email is already registered";
            }
            else if (errorDetails.Contains("password"))
            {
                return "Password does not meet requirements";
            }
            
            return "Authentication service error: " + errorDetails;
        }

        // For errors where we've wrapped a Clerk error with more detail
        if (exception.InnerException is ClerkErrors)
        {
            return exception.Message;
        }

        // Default case for other exceptions
        return exception.Message;
    }
}