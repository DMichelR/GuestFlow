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
import { Globe, MapPin, Users, CalendarDays } from "lucide-react";
import { ClickHouseService } from "@/lib/clickhouse";
import { Pie } from "react-chartjs-2";

interface GeoDistribution {
  country: string;
  tenant_count: number;
  total_stays: number;
}

export default function AdminAnalyticsTab() {
  const { getToken } = useAuth();
  const [fromDate, setFromDate] = useState<Date>(subMonths(new Date(), 6));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState<GeoDistribution[]>([]);

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

      // Query con filtro de fechas para distribución geográfica
      const geoQuery = `
        SELECT 
          dg.Country as country,
          COUNT(DISTINCT fs.TenantKey) as tenant_count,
          COUNT(*) as total_stays
        FROM FactStay fs
        JOIN DimGuest dg ON fs.GuestKey = dg.GuestKey AND dg.CurrentFlag = 1
        WHERE fs.ArrivalDateKey >= toDate('${fromStr}') AND fs.ArrivalDateKey <= toDate('${toStr}')
        GROUP BY dg.Country
        ORDER BY tenant_count DESC
      `;
      const geoResponse = await ClickHouseService.executeQuery(geoQuery, token);
      if (geoResponse.success) {
        console.log("Geo data:", geoResponse.data);
        setGeoData(geoResponse.data as unknown as GeoDistribution[]);
      }
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const countryChartData = {
    labels: geoData.map((d) => d.country || "Unknown"),
    datasets: [
      {
        label: "Tenants por País",
        data: geoData.map((d) => d.tenant_count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)",
          "rgba(34, 197, 94, 0.6)",
          "rgba(168, 85, 247, 0.6)",
          "rgba(251, 146, 60, 0.6)",
          "rgba(236, 72, 153, 0.6)",
          "rgba(14, 165, 233, 0.6)",
          "rgba(132, 204, 22, 0.6)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(251, 146, 60, 1)",
          "rgba(236, 72, 153, 1)",
          "rgba(14, 165, 233, 1)",
          "rgba(132, 204, 22, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader className="h-24 bg-gray-200" />
          <CardContent className="h-64 bg-gray-100" />
        </Card>
      </div>
    );
  }

  const totalTenants = geoData.reduce((sum, d) => sum + d.tenant_count, 0);
  const totalStays = geoData.reduce((sum, d) => sum + d.total_stays, 0);

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

      {/* Resumen Geográfico */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Países Activos
            </CardTitle>
            <Globe className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geoData.length}</div>
            <p className="text-xs opacity-80">Presencia global</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
            <p className="text-xs opacity-80">Período seleccionado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estadías Totales
            </CardTitle>
            <MapPin className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStays.toLocaleString()}
            </div>
            <p className="text-xs opacity-80">Período seleccionado</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Distribución */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Distribución por País
            </CardTitle>
            <CardDescription>
              Número de tenants por ubicación geográfica
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-full max-w-md">
              <Pie
                data={countryChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "right",
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Detalles por País
            </CardTitle>
            <CardDescription>
              Estadísticas detalladas por ubicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>País</TableHead>
                  <TableHead className="text-right">Tenants</TableHead>
                  <TableHead className="text-right">Estadías</TableHead>
                  <TableHead className="text-right">Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {geoData.map((data, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {data.country || "Desconocido"}
                    </TableCell>
                    <TableCell className="text-right">
                      {data.tenant_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {data.total_stays.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(data.total_stays / data.tenant_count).toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
