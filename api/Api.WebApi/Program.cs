using Api.Application.Interfaces;
using Api.Application.Interfaces.Repositories;
using Api.Application.Interfaces.Services;
using Api.Domain.Enums;
using Api.Infrastructure.DataBase;
using Api.Infrastructure.Repositories;
using Api.Infrastructure.Services;
using Api.Infrastructure.Services.Application;
using Api.Infrastructure.Services.Domain;
using Api.WebApi.Middleware;
using Clerk.BackendAPI;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
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

builder.Services.AddScoped<ITenantContextService, TenantContextService>();
builder.Services.AddScoped<IJwtContextService, JwtContextService>();

builder.Services.AddScoped<ITenantRepository, TenantRepository>();

builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IRoomTypeService, RoomTypeService>();
builder.Services.AddScoped<IServiceService, ServiceService>();
builder.Services.AddScoped<IGroupGuestsService, GroupGuestsService>();
builder.Services.AddScoped<IGroupRoomsService, GroupRoomsService>();
builder.Services.AddScoped<IReservationService, ReservationService>();

builder.Services.AddScoped(provider => new ClerkBackendApi(
    bearerAuth: builder.Configuration["Clerk:ApiKey"]
));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Clerk:Issuer"],
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = false
        };
        
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddProblemDetails();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseClerkAuthentication();
app.UseAuthorization();
app.MapControllers();
app.UseExceptionHandler();

app.Run();
