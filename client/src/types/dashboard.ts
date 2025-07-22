// src/types/dashboard.ts

export interface MonthlyOccupancyData {
  year: number;
  month: number;
  monthName: string;
  averageOccupancyPercentage: number;
}

export interface OccupancyReportData {
  totalRooms: number;
  monthlyOccupancy: MonthlyOccupancyData[];
  recommendations: string[];
}

export interface TodayOccupancyData {
  date: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyPercentage: number;
  recommendations: string[];
}

export interface HistoricalOccupancyData {
  firstStayDate: string;
  lastCalculationDate: string;
  totalDays: number;
  averageOccupancyPercentage: number;
  totalRooms: number;
  recommendations: string[];
}

// Income and Cancellations Types
export interface DailyIncomeData {
  date: string;
  total: number;
}

export interface CancelStatsData {
  count: number;
  percentage: number;
}

export interface VisitReasonCancellationData {
  visitReasonName: string;
  cancelledCount: number;
}

export interface IncomeAndCancellationsData {
  incomeDaily: DailyIncomeData[];
  cancelStats: CancelStatsData;
  historicalCancellationPercentage: number;
  visitReasonCancellations: VisitReasonCancellationData[];
}

// Future Reservations Types
export interface WeeklyReservationsData {
  week: string;
  reservations: number;
}

export interface FutureReservationsData {
  reservationsByWeek: WeeklyReservationsData[];
}

// Services Analytics Types
export interface TopServiceData {
  name: string;
  count: number;
  income: number;
  historicalCount: number;
}

export interface DailyServiceIncomeData {
  date: string;
  income: number;
}

export interface ServicesAnalyticsData {
  topServices: TopServiceData[];
  avgConsumptionPerGuest: number;
  incomeByDay: DailyServiceIncomeData[];
}

// Rooms Analytics Types
export interface RoomStatusTodayData {
  occupied: number;
  available: number;
  maintenance: number;
}

export interface RoomRotationData {
  room: string;
  roomType: string;
  stays: number;
}

export interface RoomsAnalyticsData {
  roomStatusToday: RoomStatusTodayData;
  rotation: RoomRotationData[];
}

// Guests Analytics Types
export interface GuestsAnalyticsData {
  frequentGuests: FrequentGuestData[];
  longStays: LongStayData[];
  cities: CityData[];
  countries: CountryData[];
}

export interface FrequentGuestData {
  name: string;
  stays: number;
}

export interface LongStayData {
  name: string;
  days: number;
}

export interface CityData {
  city: string;
  count: number;
}

export interface CountryData {
  country: string;
  count: number;
}
