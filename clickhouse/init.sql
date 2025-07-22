-- Dimensiones
CREATE TABLE IF NOT EXISTS DimTenant (
    TenantKey UInt64,
    Name String
) ENGINE = MergeTree()
ORDER BY TenantKey;

CREATE TABLE IF NOT EXISTS DimGuest (
    GuestKey UInt64,
    CID String,
    FullName String,
    Age UInt16,
    Profession String,
    City String,
    Country String,
    EffectiveDate Date,
    ExpiryDate Date,
    CurrentFlag UInt8
) ENGINE = MergeTree()
ORDER BY GuestKey;

CREATE TABLE IF NOT EXISTS DimRoom (
    RoomKey UInt64,
    RoomNumber String,
    RoomType String,
    Price Decimal(12,2),
    Status String,
    EffectiveDate Date,
    ExpiryDate Date,
    CurrentFlag UInt8
) ENGINE = MergeTree()
ORDER BY RoomKey;

CREATE TABLE IF NOT EXISTS DimCompany (
    CompanyKey UInt64,
    Name String
) ENGINE = MergeTree()
ORDER BY CompanyKey;

CREATE TABLE IF NOT EXISTS DimService (
    ServiceKey UInt64,
    Name String,
    Description String
) ENGINE = MergeTree()
ORDER BY ServiceKey;

CREATE TABLE IF NOT EXISTS DimVisitReason (
    VisitReasonKey UInt64,
    Name String
) ENGINE = MergeTree()
ORDER BY VisitReasonKey;

CREATE TABLE IF NOT EXISTS DimUser (
    UserKey UInt64,
    FullName String,
    Role String
) ENGINE = MergeTree()
ORDER BY UserKey;

CREATE TABLE IF NOT EXISTS DimTime (
    DateKey Date,
    Day UInt8,
    Month String,
    Quarter UInt8,
    Year UInt16,
    IsWeekend UInt8,
    IsHoliday UInt8
) ENGINE = MergeTree()
ORDER BY DateKey;

-- Hechos
CREATE TABLE IF NOT EXISTS FactStay (
    StayKey UInt64,
    FinalPrice Decimal(12,2),
    Pax UInt16,
    Nights UInt16,
    RoomsCount UInt8,
    ServicesCount UInt16,
    TenantKey UInt64,
    GuestKey UInt64,
    CompanyKey UInt64,
    VisitReasonKey UInt64,
    ArrivalDateKey Date,
    DepartureDateKey Date,
    ReservationDateKey Date
) ENGINE = MergeTree()
ORDER BY StayKey;

CREATE TABLE IF NOT EXISTS FactServiceTicket (
    ServiceTicketKey UInt64,
    ServicePrice Decimal(12,2),
    Quantity UInt16,
    TenantKey UInt64,
    StayKey UInt64,
    ServiceKey UInt64,
    UserKey UInt64,
    CreatedDateKey Date
) ENGINE = MergeTree()
ORDER BY ServiceTicketKey;

-- Puentes
CREATE TABLE IF NOT EXISTS BridgeStayGuests (
    StayKey UInt64,
    GuestKey UInt64,
    Role String
) ENGINE = MergeTree()
ORDER BY (StayKey, GuestKey);

CREATE TABLE IF NOT EXISTS BridgeStayRooms (
    StayKey UInt64,
    RoomKey UInt64,
    UsageType String
) ENGINE = MergeTree()
ORDER BY (StayKey, RoomKey);
