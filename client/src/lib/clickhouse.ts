// src/lib/clickhouse.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8111/api";

export interface ClickHouseQueryRequest {
  query: string;
}

export interface ClickHouseQueryResponse {
  success: boolean;
  rowCount: number;
  columns: string[];
  data: Record<string, unknown>[];
  message?: string;
}

export interface DatabaseInfo {
  version: string;
  databases: string[];
}

export interface TablesResponse {
  database: string;
  tables: string[];
}

/**
 * Servicio para interactuar con ClickHouse a través de la API
 * El token debe ser pasado desde el componente que usa useAuth()
 */
export class ClickHouseService {
  private static getHeaders(token?: string | null): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Prueba la conexión a ClickHouse
   */
  static async testConnection(
    token?: string | null
  ): Promise<{ success: boolean; message: string }> {
    try {
      const headers = this.getHeaders(token);
      const response = await fetch(`${API_URL}/ClickHouse/test-connection`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error testing ClickHouse connection:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Obtiene información de la base de datos
   */
  static async getDatabaseInfo(
    token?: string | null
  ): Promise<DatabaseInfo | null> {
    try {
      const headers = this.getHeaders(token);
      const response = await fetch(`${API_URL}/ClickHouse/database-info`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting database info:", error);
      return null;
    }
  }

  /**
   * Obtiene las tablas de una base de datos
   */
  static async getTables(
    database: string = "default",
    token?: string | null
  ): Promise<TablesResponse | null> {
    try {
      const headers = this.getHeaders(token);
      const response = await fetch(
        `${API_URL}/ClickHouse/tables?database=${encodeURIComponent(database)}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting tables:", error);
      return null;
    }
  }

  /**
   * Ejecuta una consulta personalizada en ClickHouse
   */
  static async executeQuery(
    query: string,
    token?: string | null
  ): Promise<ClickHouseQueryResponse> {
    try {
      const headers = this.getHeaders(token);
      const response = await fetch(`${API_URL}/ClickHouse/query`, {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error executing query:", error);
      return {
        success: false,
        rowCount: 0,
        columns: [],
        data: [],
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Métodos de utilidad para consultas comunes
   */

  // Obtiene métricas del sistema para admin
  static async getSystemMetrics(token?: string | null) {
    const query = `
      SELECT 
        COUNT(DISTINCT TenantKey) as total_tenants,
        COUNT(DISTINCT GuestKey) as total_guests,
        COUNT(*) as total_stays,
        SUM(FinalPrice) as total_revenue
      FROM FactStay
      WHERE ArrivalDateKey >= today() - 30
    `;
    return await this.executeQuery(query, token);
  }

  // Obtiene actividad por tenant
  static async getTenantActivity(days: number = 30, token?: string | null) {
    const query = `
      SELECT 
        TenantKey as tenant_id,
        COUNT(DISTINCT GuestKey) as unique_guests,
        COUNT(*) as total_stays,
        SUM(FinalPrice) as revenue,
        AVG(FinalPrice) as avg_revenue
      FROM FactStay
      WHERE ArrivalDateKey >= today() - ${days}
      GROUP BY TenantKey
      ORDER BY revenue DESC
    `;
    return await this.executeQuery(query, token);
  }

  // Obtiene estadísticas de uso por tenant
  static async getTenantUsageStats(token?: string | null) {
    const query = `
      SELECT 
        fs.TenantKey as tenant_id,
        COUNT(DISTINCT bsr.RoomKey) as rooms_used,
        COUNT(DISTINCT fs.GuestKey) as guests_registered,
        COUNT(*) as total_reservations,
        MIN(fs.ArrivalDateKey) as first_activity,
        MAX(fs.DepartureDateKey) as last_activity
      FROM FactStay fs
      LEFT JOIN BridgeStayRooms bsr ON fs.StayKey = bsr.StayKey
      GROUP BY fs.TenantKey
      ORDER BY total_reservations DESC
    `;
    return await this.executeQuery(query, token);
  }

  // Obtiene tendencias de crecimiento del sistema
  static async getSystemGrowthTrends(token?: string | null) {
    const query = `
      SELECT 
        toStartOfMonth(ArrivalDateKey) as month,
        COUNT(DISTINCT TenantKey) as active_tenants,
        COUNT(DISTINCT GuestKey) as unique_guests,
        COUNT(*) as total_stays,
        SUM(FinalPrice) as monthly_revenue
      FROM FactStay
      WHERE ArrivalDateKey >= today() - 365
      GROUP BY month
      ORDER BY month
    `;
    return await this.executeQuery(query, token);
  }

  // Obtiene distribución geográfica de tenants
  static async getTenantGeographicDistribution(token?: string | null) {
    const query = `
      SELECT 
        g.Country as country,
        COUNT(DISTINCT fs.TenantKey) as tenant_count,
        COUNT(*) as total_stays
      FROM FactStay fs
      JOIN DimGuest g ON fs.GuestKey = g.GuestKey AND g.CurrentFlag = 1
      WHERE g.Country IS NOT NULL AND g.Country != ''
      GROUP BY g.Country
      ORDER BY tenant_count DESC
    `;
    return await this.executeQuery(query, token);
  }

  // Obtiene los tenants más activos
  static async getTopTenants(limit: number = 10, token?: string | null) {
    const query = `
      SELECT 
        TenantKey as tenant_id,
        COUNT(*) as total_bookings,
        SUM(FinalPrice) as total_revenue,
        AVG(FinalPrice) as avg_booking_value,
        COUNT(DISTINCT GuestKey) as unique_guests
      FROM FactStay
      WHERE ArrivalDateKey >= today() - 90
      GROUP BY TenantKey
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `;
    return await this.executeQuery(query, token);
  }

  // Obtiene métricas de performance del sistema
  static async getSystemPerformanceMetrics(token?: string | null) {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT ArrivalDateKey) as days_with_data,
        MIN(ArrivalDateKey) as oldest_record,
        MAX(ArrivalDateKey) as newest_record,
        COUNT(DISTINCT TenantKey) as total_tenants
      FROM FactStay
    `;
    return await this.executeQuery(query, token);
  }
}
