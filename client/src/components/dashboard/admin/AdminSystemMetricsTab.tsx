"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { format, subMonths } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Server,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Database,
  CalendarDays,
} from "lucide-react";
import { ClickHouseService } from "@/lib/clickhouse";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface SystemMetrics {
  total_tenants: number;
  total_guests: number;
  total_stays: number;
  total_revenue: number;
}

interface GrowthData {
  month: string;
  active_tenants: number;
  unique_guests: number;
  total_stays: number;
  monthly_revenue: number;
}

interface PerformanceMetrics {
  total_records: number;
  days_with_data: number;
  total_tenants: number;
}

export default function AdminSystemMetricsTab() {
  const { getToken } = useAuth();
  const [fromDate, setFromDate] = useState<Date>(subMonths(new Date(), 6));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);

  const handlePresetClick = (preset: string) => {
    const now = new Date();
    let newFromDate: Date;
    const newToDate = now;

    switch (preset) {
      case "1m":
        newFromDate = subMonths(now, 1);
        break;
      case "3m":
        newFromDate = subMonths(now, 3);
        break;
      case "6m":
        newFromDate = subMonths(now, 6);
        break;
      case "1y":
        newFromDate = subMonths(now, 12);
        break;
      default:
        return;
    }

    setFromDate(newFromDate);
    setToDate(newToDate);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const fromStr = format(fromDate, "yyyy-MM-dd");
      const toStr = format(toDate, "yyyy-MM-dd");

      // Cargar métricas del sistema con rango de fechas
      const metricsQuery = `
        SELECT 
          COUNT(DISTINCT TenantKey) as total_tenants,
          COUNT(DISTINCT GuestKey) as total_guests,
          COUNT(*) as total_stays,
          toFloat64(COALESCE(SUM(FinalPrice), 0)) as total_revenue
        FROM FactStay
        WHERE ArrivalDateKey >= toDate('${fromStr}') AND ArrivalDateKey <= toDate('${toStr}')
      `;
      const metricsResponse = await ClickHouseService.executeQuery(
        metricsQuery,
        token
      );
      if (metricsResponse.success && metricsResponse.data.length > 0) {
        console.log("Metrics data raw:", metricsResponse.data[0]);
        console.log(
          "Total revenue:",
          metricsResponse.data[0].total_revenue,
          "Type:",
          typeof metricsResponse.data[0].total_revenue
        );
        setMetrics(metricsResponse.data[0] as unknown as SystemMetrics);
      }

      // Cargar datos de crecimiento con filtro de fechas
      const growthQuery = `
        SELECT 
          formatDateTime(toStartOfMonth(ArrivalDateKey), '%Y-%m-01') as month,
          COUNT(DISTINCT TenantKey) as active_tenants,
          COUNT(DISTINCT GuestKey) as unique_guests,
          COUNT(*) as total_stays,
          toFloat64(COALESCE(SUM(FinalPrice), 0)) as monthly_revenue
        FROM FactStay
        WHERE ArrivalDateKey >= toDate('${fromStr}') AND ArrivalDateKey <= toDate('${toStr}')
        GROUP BY month
        ORDER BY month
      `;
      const growthResponse = await ClickHouseService.executeQuery(
        growthQuery,
        token
      );
      if (growthResponse.success) {
        console.log("Growth data:", growthResponse.data);
        console.log("Growth data count:", growthResponse.data.length);
        setGrowthData(growthResponse.data as unknown as GrowthData[]);
      }

      // Cargar métricas de performance
      const perfResponse = await ClickHouseService.getSystemPerformanceMetrics(
        token
      );
      if (perfResponse.success && perfResponse.data.length > 0) {
        setPerformanceMetrics(
          perfResponse.data[0] as unknown as PerformanceMetrics
        );
      }
    } catch (error) {
      console.error("Error loading system metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const revenueChartData = {
    labels: growthData.map((d) =>
      new Date(d.month).toLocaleDateString("es-ES", {
        month: "short",
        year: "numeric",
      })
    ),
    datasets: [
      {
        label: "Ingresos Mensuales",
        data: growthData.map((d) => {
          const val =
            typeof d.monthly_revenue === "number"
              ? d.monthly_revenue
              : parseFloat(String(d.monthly_revenue));
          return isNaN(val) ? 0 : val;
        }),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
      },
    ],
  };

  const tenantsChartData = {
    labels: growthData.map((d) =>
      new Date(d.month).toLocaleDateString("es-ES", {
        month: "short",
        year: "numeric",
      })
    ),
    datasets: [
      {
        label: "Tenants Activos",
        data: growthData.map((d) => {
          const val =
            typeof d.active_tenants === "number"
              ? d.active_tenants
              : parseInt(String(d.active_tenants));
          return isNaN(val) ? 0 : val;
        }),
        fill: false,
        borderColor: "rgba(34, 197, 94, 1)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        tension: 0.4,
      },
      {
        label: "Huéspedes Únicos",
        data: growthData.map((d) => {
          const val =
            typeof d.unique_guests === "number"
              ? d.unique_guests
              : parseInt(String(d.unique_guests));
          return isNaN(val) ? 0 : val;
        }),
        fill: false,
        borderColor: "rgba(168, 85, 247, 1)",
        backgroundColor: "rgba(168, 85, 247, 0.5)",
        tension: 0.4,
      },
    ],
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-gray-200" />
              <CardContent className="h-16 bg-gray-100" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
          <CardDescription>
            Selecciona el rango de fechas para analizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Selectores de fecha */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">
                  Fecha Inicial
                </label>
                <DatePicker
                  date={fromDate}
                  onDateChange={(date) => date && setFromDate(date)}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">
                  Fecha Final
                </label>
                <DatePicker
                  date={toDate}
                  onDateChange={(date) => date && setToDate(date)}
                />
              </div>
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("1m")}
              >
                Último Mes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("3m")}
              >
                Últimos 3 Meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("6m")}
              >
                Últimos 6 Meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("1y")}
              >
                Último Año
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Server className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const val = metrics?.total_tenants ?? 0;
                const num =
                  typeof val === "number" ? val : parseInt(String(val));
                return isNaN(num) ? 0 : num;
              })()}
            </div>
            <p className="text-xs opacity-80">Clientes activos en el sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Huéspedes Totales
            </CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const val = metrics?.total_guests ?? 0;
                const num =
                  typeof val === "number" ? val : parseInt(String(val));
                return isNaN(num) ? 0 : num.toLocaleString();
              })()}
            </div>
            <p className="text-xs opacity-80">Período seleccionado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Estadías
            </CardTitle>
            <Activity className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const val = metrics?.total_stays ?? 0;
                const num =
                  typeof val === "number" ? val : parseInt(String(val));
                return isNaN(num) ? 0 : num.toLocaleString();
              })()}
            </div>
            <p className="text-xs opacity-80">Período seleccionado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {(() => {
                const revenue = metrics?.total_revenue ?? 0;
                const numRevenue =
                  typeof revenue === "number"
                    ? revenue
                    : parseFloat(String(revenue)) || 0;
                return numRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
              })()}
            </div>
            <p className="text-xs opacity-80">Período seleccionado</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Performance del Sistema */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Performance del Sistema
            </CardTitle>
            <CardDescription>
              Estadísticas de la base de datos ClickHouse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Registros Totales
                </p>
                <p className="text-2xl font-bold">
                  {performanceMetrics.total_records?.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Días con Datos</p>
                <p className="text-2xl font-bold">
                  {performanceMetrics.days_with_data}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Tenants Registrados
                </p>
                <p className="text-2xl font-bold">
                  {performanceMetrics.total_tenants}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos de Crecimiento */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tendencia de Ingresos
            </CardTitle>
            <CardDescription>Ingresos mensuales del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {growthData.length > 0 ? (
              <Bar
                data={revenueChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No hay datos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Crecimiento de Usuarios
            </CardTitle>
            <CardDescription>
              Tenants activos y huéspedes únicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {growthData.length > 0 ? (
              <Line
                data={tenantsChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No hay datos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
