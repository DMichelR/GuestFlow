using System.Text;
using Api.Application.Interfaces;
using Api.Application.Interfaces.Repositories;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.Infrastructure.DataBase;
using Api.Infrastructure.Repositories;
using Api.Infrastructure.Services;
using Api.Infrastructure.Services.Application.Managers;
using Api.Infrastructure.Services.Domain;
using Api.WebApi.Middleware;
using Clerk.BackendAPI;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

// Configurar la conexión a la base de datos
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>((provider, options) =>
{
    options.UseNpgsql(connectionString, o => {
        o.MapEnum<AccessLevel>();
        o.MapEnum<RoomStatus>();
        o.MapEnum<StayState>();
    }).EnableSensitiveDataLogging();
});

builder.Services.AddScoped<Api.Application.Interfaces.DataBase.IApplicationDbContext, ApplicationDbContext>();

builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<ITenantRepository, TenantRepository>();
builder.Services.AddScoped<ITenantManager, TenantManager>();
builder.Services.AddScoped<IUserService, UserService>();

// Configurar Clerk como servicio de autenticación
builder.Services.AddScoped(provider => new ClerkBackendApi(
    bearerAuth: builder.Configuration["Clerk:ApiKey"]
));

// Configurar autenticación - Usando JWT Bearer para validar tokens de Clerk
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // No configuramos TokenValidationParameters aquí porque
        // el middleware personalizado ClerkAuthenticationMiddleware se encarga
        // de la validación de tokens
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Función que simplemente permite que el procesamiento continúe
                // La validación real se realizará en ClerkAuthenticationMiddleware
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddProblemDetails();

WebApplication app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseClerkAuthentication(); // Middleware personalizado para Clerk
app.UseAuthorization();
app.MapControllers();
app.UseExceptionHandler();

app.Run();
