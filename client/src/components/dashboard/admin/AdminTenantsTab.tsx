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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { ClickHouseService } from "@/lib/clickhouse";
import { Bar } from "react-chartjs-2";

interface TenantActivity {
  tenant_id: string;
  unique_guests: number;
  total_stays: number;
  revenue: number;
  avg_revenue: number;
}

interface TenantUsage {
  tenant_id: string;
  rooms_used: number;
  guests_registered: number;
  total_reservations: number;
  first_activity: string;
  last_activity: string;
}

interface TopTenant {
  tenant_id: string;
  total_bookings: number;
  total_revenue: number;
  avg_booking_value: number;
  unique_guests: number;
}

export default function AdminTenantsTab() {
  const { getToken } = useAuth();
  const [fromDate, setFromDate] = useState<Date>(subMonths(new Date(), 6));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [tenantActivity, setTenantActivity] = useState<TenantActivity[]>([]);
  const [tenantUsage, setTenantUsage] = useState<TenantUsage[]>([]);
  const [topTenants, setTopTenants] = useState<TopTenant[]>([]);

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

      // Cargar actividad de tenants con filtro de fechas
      const activityQuery = `
        SELECT 
          TenantKey as tenant_id,
          COUNT(DISTINCT GuestKey) as unique_guests,
          COUNT(*) as total_stays,
          toFloat64(COALESCE(SUM(FinalPrice), 0)) as revenue,
          toFloat64(COALESCE(AVG(FinalPrice), 0)) as avg_revenue
        FROM FactStay
        WHERE ArrivalDateKey >= toDate('${fromStr}') AND ArrivalDateKey <= toDate('${toStr}')
        GROUP BY TenantKey
        ORDER BY revenue DESC
      `;
      const activityResponse = await ClickHouseService.executeQuery(
        activityQuery,
        token
      );
      if (activityResponse.success) {
        setTenantActivity(activityResponse.data as unknown as TenantActivity[]);
      }

      // Cargar uso de tenants con filtro de fechas
      const usageQuery = `
        SELECT 
          fs.TenantKey as tenant_id,
          COUNT(DISTINCT bsr.RoomKey) as rooms_used,
          COUNT(DISTINCT fs.GuestKey) as guests_registered,
          COUNT(*) as total_reservations,
          MIN(fs.ArrivalDateKey) as first_activity,
          MAX(fs.DepartureDateKey) as last_activity
        FROM FactStay fs
        LEFT JOIN BridgeStayRooms bsr ON fs.StayKey = bsr.StayKey
        WHERE fs.ArrivalDateKey >= toDate('${fromStr}') AND fs.ArrivalDateKey <= toDate('${toStr}')
        GROUP BY fs.TenantKey
        ORDER BY total_reservations DESC
      `;
      const usageResponse = await ClickHouseService.executeQuery(
        usageQuery,
        token
      );
      if (usageResponse.success) {
        setTenantUsage(usageResponse.data as unknown as TenantUsage[]);
      }

      // Cargar top tenants con filtro de fechas
      const topQuery = `
        SELECT 
          TenantKey as tenant_id,
          COUNT(*) as total_bookings,
          toFloat64(COALESCE(SUM(FinalPrice), 0)) as total_revenue,
          toFloat64(COALESCE(AVG(FinalPrice), 0)) as avg_booking_value,
          COUNT(DISTINCT GuestKey) as unique_guests
        FROM FactStay
        WHERE ArrivalDateKey >= toDate('${fromStr}') AND ArrivalDateKey <= toDate('${toStr}')
        GROUP BY TenantKey
        ORDER BY total_revenue DESC
        LIMIT 10
      `;
      const topResponse = await ClickHouseService.executeQuery(topQuery, token);
      if (topResponse.success) {
        setTopTenants(topResponse.data as unknown as TopTenant[]);
      }
    } catch (error) {
      console.error("Error loading tenant data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const topTenantsChartData = {
    labels: topTenants.map((t) => `Tenant ${t.tenant_id}`),
    datasets: [
      {
        label: "Ingresos",
        data: topTenants.map((t) => t.total_revenue),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-gray-200" />
              <CardContent className="h-64 bg-gray-100" />
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

      {/* Resumen de Tenants */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tenants Activos
            </CardTitle>
            <Building2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantActivity.length}</div>
            <p className="text-xs opacity-80">Período seleccionado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reservaciones
            </CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantActivity
                .reduce((sum, t) => sum + t.total_stays, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs opacity-80">Período seleccionado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingreso Promedio
            </CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {tenantActivity.length > 0
                ? (
                    tenantActivity.reduce((sum, t) => sum + t.avg_revenue, 0) /
                    tenantActivity.length
                  ).toFixed(2)
                : "0.00"}
            </div>
            <p className="text-xs opacity-80">Por reservación</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top 10 Tenants por Ingresos
          </CardTitle>
          <CardDescription>Últimos 90 días</CardDescription>
        </CardHeader>
        <CardContent>
          <Bar
            data={topTenantsChartData}
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
        </CardContent>
      </Card>

      {/* Tabla de Actividad de Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Actividad de Tenants
          </CardTitle>
          <CardDescription>
            Detalles de actividad de los últimos 30 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant ID</TableHead>
                <TableHead className="text-right">Huéspedes Únicos</TableHead>
                <TableHead className="text-right">Total Estadías</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Ingreso Promedio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenantActivity.map((tenant) => (
                <TableRow key={tenant.tenant_id}>
                  <TableCell className="font-medium">
                    {tenant.tenant_id}
                  </TableCell>
                  <TableCell className="text-right">
                    {tenant.unique_guests}
                  </TableCell>
                  <TableCell className="text-right">
                    {tenant.total_stays}
                  </TableCell>
                  <TableCell className="text-right">
                    $
                    {tenant.revenue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${tenant.avg_revenue.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabla de Uso de Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estadísticas de Uso
          </CardTitle>
          <CardDescription>Información completa de cada tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant ID</TableHead>
                <TableHead className="text-right">Habitaciones</TableHead>
                <TableHead className="text-right">Huéspedes</TableHead>
                <TableHead className="text-right">Reservas</TableHead>
                <TableHead className="text-right">Primera Actividad</TableHead>
                <TableHead className="text-right">Última Actividad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenantUsage.slice(0, 10).map((tenant) => (
                <TableRow key={tenant.tenant_id}>
                  <TableCell className="font-medium">
                    {tenant.tenant_id}
                  </TableCell>
                  <TableCell className="text-right">
                    {tenant.rooms_used}
                  </TableCell>
                  <TableCell className="text-right">
                    {tenant.guests_registered}
                  </TableCell>
                  <TableCell className="text-right">
                    {tenant.total_reservations}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(tenant.first_activity).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(tenant.last_activity).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
