using Api.Domain.Entities;
using Api.Domain.Entities.Concretes.GuestRelated;
using Api.Domain.Entities.Concretes.RoomRelated;
using Api.Domain.Entities.Concretes.ServiceRelated;
using Api.Domain.Entities.Concretes.StayRelated;
using Api.Domain.Entities.Concretes.UserRelated;
using Microsoft.EntityFrameworkCore;

namespace Api.Application.Interfaces.DataBase;

public interface IApplicationDbContext
{
    DbSet<Tenant> Tenants { get; set; }
    DbSet<User> Users { get; set; }
    DbSet<Guest> Guests { get; set; }
    DbSet<Company> Companies { get; set; }
    DbSet<Profession> Professions { get; set; }
    DbSet<City> Cities { get; set; }
    DbSet<Country> Countries { get; set; }
    DbSet<Stay> Stays { get; set; }
    DbSet<VisitReason> VisitReasons { get; set; }
    DbSet<GroupGuests> GroupGuests { get; set; }
    DbSet<GroupRooms> GroupRooms { get; set; }
    DbSet<RoomType> RoomTypes { get; set; }
    DbSet<Room> Rooms { get; set; }
    DbSet<Service> Services { get; set; }
    DbSet<ServiceTicket> ServiceTickets { get; set; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    int SaveChanges();
}
