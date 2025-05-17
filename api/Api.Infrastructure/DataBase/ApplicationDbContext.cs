using Api.Domain.Entities;
using Api.Domain.Entities.Concretes.GuestRelated;
using Api.Domain.Entities.Concretes.RoomRelated;
using Api.Domain.Entities.Concretes.ServiceRelated;
using Api.Domain.Entities.Concretes.StayRelated;
using Api.Domain.Entities.Concretes.UserRelated;
using Api.Domain.Entities.Interface;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Api.Application.Interfaces;
using Api.Application.Interfaces.DataBase;
using Api.Domain.Enums;

namespace Api.Infrastructure.DataBase;

public class ApplicationDbContext : DbContext,
    IApplicationDbContext
{
    private readonly Guid? _currentTenantId;
    
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantContextService tenantService = null!) 
        : base(options) 
    {
        _currentTenantId = tenantService.GetCurrentTenantId();
    }
    
    public DbSet<Tenant> Tenants { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    
    public DbSet<Guest> Guests { get; set; } = null!;
    public DbSet<Company> Companies { get; set; } = null!;
    public DbSet<Profession> Professions { get; set; } = null!;
    public DbSet<City> Cities { get; set; } = null!;
    public DbSet<Country> Countries { get; set; } = null!;
    
    public DbSet<Stay> Stays { get; set; } = null!;
    public DbSet<VisitReason> VisitReasons { get; set; } = null!;
    public DbSet<GroupGuests> GroupGuests { get; set; } = null!;
    public DbSet<GroupRooms> GroupRooms { get; set; } = null!;
    
    public DbSet<RoomType> RoomTypes { get; set; } = null!;
    public DbSet<Room> Rooms { get; set; } = null!;
    
    public DbSet<Service> Services { get; set; } = null!;
    public DbSet<ServiceTicket> ServiceTickets { get; set; } = null!;
    
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        UpdateAuditFields();
        return base.SaveChanges();
    }

    private void UpdateAuditFields()
    {
        var entries = ChangeTracker.Entries<IEntity>();
        
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                
                // Set TenantId for new entities if they implement ITenantEntity
                if (_currentTenantId.HasValue && entry.Entity is ITenantEntity tenantEntity)
                {
                    if (tenantEntity.TenantId == Guid.Empty)
                    {
                        var tenantProperty = entry.Property("TenantId");
                        tenantProperty.CurrentValue = _currentTenantId.Value;
                    }
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property("Updated").CurrentValue = DateTime.UtcNow;
            }
        }
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Registrar los esquemas de enum en PostgreSQL
        modelBuilder.HasPostgresEnum<AccessLevel>();
        modelBuilder.HasPostgresEnum<RoomStatus>();
        modelBuilder.HasPostgresEnum<StayState>();
        
        // Configure User - AccessLevel relationship
        modelBuilder.Entity<User>()
            .Property(u => u.AccessLevel)
            .HasColumnType("access_level");
        
        // Configure Guest relationships
        modelBuilder.Entity<Guest>()
            .HasOne(g => g.City)
            .WithMany()
            .HasForeignKey(g => g.CityId);
            
        modelBuilder.Entity<Guest>()
            .HasOne(g => g.Country)
            .WithMany()
            .HasForeignKey(g => g.CountryId);
            
        modelBuilder.Entity<Guest>()
            .HasOne(g => g.Profession)
            .WithMany()
            .HasForeignKey(g => g.ProfessionId);
            
        
        // Configure Stay relationships
        modelBuilder.Entity<Stay>()
            .HasOne(s => s.VisitReason)
            .WithMany()
            .HasForeignKey(s => s.VisitReasonId);
        
        modelBuilder.Entity<Stay>()
            .HasOne(s => s.Company)
            .WithMany()
            .HasForeignKey(s => s.CompanyId);
        
        modelBuilder.Entity<Stay>()
            .HasOne(s => s.Guest)
            .WithMany(g => g.Stays)
            .HasForeignKey(s => s.HolderId);
        
        modelBuilder.Entity<Stay>()
            .Property(s => s.State)
            .HasColumnType("stay_state");
            
        // Configure Room relationships
        modelBuilder.Entity<Room>()
            .HasOne(r => r.RoomType)
            .WithMany(rt => rt.Rooms)
            .HasForeignKey(r => r.RoomTypeId);
            
        modelBuilder.Entity<Room>()
            .Property(r => r.Status)
            .HasColumnType("room_status");
            
        // Configure ServiceTicket relationships
        modelBuilder.Entity<ServiceTicket>()
            .HasOne(st => st.Service)
            .WithMany(s => s.ServiceTickets)
            .HasForeignKey(st => st.ServiceId);
            
        modelBuilder.Entity<ServiceTicket>()
            .HasOne(st => st.Stay)
            .WithMany(s => s.ServiceTickets)
            .HasForeignKey(st => st.StayId);
        
        modelBuilder.Entity<ServiceTicket>()
            .HasOne(st => st.User)
            .WithMany(u => u.ServiceTickets)
            .HasForeignKey(st => st.UserId);
            
        // Configure GroupGuests relationships
        modelBuilder.Entity<GroupGuests>()
            .HasOne(gg => gg.Stay)
            .WithMany(s => s.GroupGuests)
            .HasForeignKey(gg => gg.StayId);
            
        modelBuilder.Entity<GroupGuests>()
            .HasOne(gg => gg.Guest)
            .WithMany(g => g.GroupGuests)
            .HasForeignKey(gg => gg.GuestId);
            
        // Configure GroupRooms relationships
        modelBuilder.Entity<GroupRooms>()
            .HasOne(gr => gr.Stay)
            .WithMany(s => s.GroupRooms)
            .HasForeignKey(gr => gr.StayId);
            
        modelBuilder.Entity<GroupRooms>()
            .HasOne(gr => gr.Room)
            .WithMany(r => r.GroupRooms)
            .HasForeignKey(gr => gr.RoomId);
        
        ApplyGlobalFilters(modelBuilder);
    }
    
    private void ApplyGlobalFilters(ModelBuilder modelBuilder)
    {
        // Only apply tenant filtering if we have a tenant context
        if (_currentTenantId.HasValue)
        {
            // Find all entity types that implement ITenantEntity
            var tenantEntityTypes = modelBuilder.Model.GetEntityTypes()
                .Where(e => typeof(ITenantEntity).IsAssignableFrom(e.ClrType));

            // Apply filter to all tenant entities
            foreach (var entityType in tenantEntityTypes)
            {
                // Skip the Tenant entity itself
                if (entityType.ClrType == typeof(Tenant))
                    continue;
                
                var parameter = Expression.Parameter(entityType.ClrType, "e");
                var propertyGetter = Expression.PropertyOrField(parameter, "TenantId");
                var tenantIdConstant = Expression.Constant(_currentTenantId.Value);
                var filterExpression = Expression.Equal(propertyGetter, tenantIdConstant);
                var lambda = Expression.Lambda(filterExpression, parameter);

                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
            }
        }
    }
}
