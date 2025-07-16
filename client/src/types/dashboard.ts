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
