"use client";

import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  CalendarDays,
  BedDouble,
  TrendingUp,
  AlertCircle,
  Bot,
  CheckCircle,
  Clock,
  Wrench,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { aiService } from "@/lib/aiService";
import type { RoomsAnalyticsData } from "@/types/dashboard";

export default function RoomsTab() {
  const [fromDate, setFromDate] = useState<Date>(subMonths(new Date(), 6));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [data, setData] = useState<RoomsAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Función para obtener datos de habitaciones
  const fetchRoomsData = async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);

    try {
      const fromStr = format(from, "yyyy-MM-dd");
      const toStr = format(to, "yyyy-MM-dd");

      const response = await fetch(
        `/api/tenantdashboard/analytics/rooms?from=${fromStr}&to=${toStr}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: RoomsAnalyticsData = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchRoomsData(fromDate, toDate);
  }, [fromDate, toDate]);

  // Función para manejar el cambio de fechas
  const handleDateRangeUpdate = () => {
    fetchRoomsData(fromDate, toDate);
  };

  // Presets de fechas
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
      case "2y":
        newFromDate = subMonths(now, 24);
        break;
      case "historico":
        newFromDate = new Date("2022-01-01");
        break;
      default:
        return;
    }

    setFromDate(newFromDate);
    setToDate(newToDate);
    fetchRoomsData(newFromDate, newToDate);
  };

  // Función para obtener recomendaciones de IA usando Gemini
  const fetchAIRecommendations = async () => {
    if (!data) return;

    setIsLoadingAI(true);
    try {
      const totalRooms =
        data.roomStatusToday.occupied +
        data.roomStatusToday.available +
        data.roomStatusToday.maintenance;

      const topRotationRooms = data.rotation
        .sort((a, b) => b.stays - a.stays)
        .slice(0, 5);

      const roomsData = {
        totalRooms,
        roomStatusToday: data.roomStatusToday,
        topRotationRooms,
      };

      const recommendations = await aiService.getRoomsRecommendations(
        roomsData
      );
      setAiRecommendations(recommendations);
    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
      setAiRecommendations([
        "Error al obtener recomendaciones de IA. Verifica tu configuración de Gemini API",
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Preparar datos para gráficos
  const roomStatusData = data
    ? [
        {
          name: "Ocupadas",
          value: data.roomStatusToday.occupied,
          color: "#22c55e",
        },
        {
          name: "Disponibles",
          value: data.roomStatusToday.available,
          color: "#3b82f6",
        },
        {
          name: "Mantenimiento",
          value: data.roomStatusToday.maintenance,
          color: "#f59e0b",
        },
      ]
    : [];

  const rotationChartData =
    data?.rotation
      .sort((a, b) => b.stays - a.stays)
      .slice(0, 10)
      .map((room) => ({
        room: room.room,
        roomType: room.roomType,
        stays: room.stays,
        displayName: `${room.room}`,
      })) || [];

  // Calcular métricas
  const totalRooms = data
    ? data.roomStatusToday.occupied +
      data.roomStatusToday.available +
      data.roomStatusToday.maintenance
    : 0;
  const occupancyRate =
    totalRooms > 0
      ? ((data?.roomStatusToday.occupied || 0) / totalRooms) * 100
      : 0;
  const avgStaysPerRoom = data?.rotation.length
    ? data.rotation.reduce((sum, room) => sum + room.stays, 0) /
      data.rotation.length
    : 0;
  const maxStays = data?.rotation.length
    ? Math.max(...data.rotation.map((r) => r.stays))
    : 0;

  return (
    <div className="space-y-6">
      {/* Controles de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Rango de Fechas para Rotación
          </CardTitle>
          <CardDescription>
            Selecciona el período para analizar rotación de habitaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Presets de fechas */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("1m")}
              >
                Este mes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("3m")}
              >
                Últimos 3 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("6m")}
              >
                Últimos 6 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("1y")}
              >
                Último año
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("2y")}
              >
                Últimos 2 años
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("historico")}
              >
                Histórico
              </Button>
            </div>

            {/* Selectores de fecha */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha inicial</label>
                <DatePicker
                  date={fromDate}
                  onDateChange={(date) => date && setFromDate(date)}
                  placeholder="Seleccionar fecha inicial"
                  disabled={(date) => date > toDate || date > new Date()}
                  className="w-[240px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha final</label>
                <DatePicker
                  date={toDate}
                  onDateChange={(date) => date && setToDate(date)}
                  placeholder="Seleccionar fecha final"
                  disabled={(date) => date < fromDate || date > new Date()}
                  className="w-[240px]"
                />
              </div>

              <Button
                onClick={handleDateRangeUpdate}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Cargando..." : "Actualizar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="text-muted-foreground font-medium">
                Analizando datos de habitaciones...
              </p>
              <p className="text-sm text-muted-foreground">
                Esto puede tomar unos segundos
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Datos principales */}
      {data && !loading && (
        <div className="grid gap-6">
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Habitaciones
                </CardTitle>
                <BedDouble className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRooms}</div>
                <p className="text-xs text-muted-foreground">
                  Inventario completo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tasa de Ocupación
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {occupancyRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Del total de habitaciones
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rotación Promedio
                </CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgStaysPerRoom.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Estancias por habitación
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Mayor Rotación
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maxStays}</div>
                <p className="text-xs text-muted-foreground">
                  Estancias máximas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estado actual de habitaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Estado Actual de Habitaciones</CardTitle>
                <CardDescription>
                  Distribución de habitaciones por estado hoy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roomStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {roomStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${value} habitaciones`,
                          "Cantidad",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Leyenda personalizada */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Ocupadas</p>
                      <p className="text-xs text-muted-foreground">
                        {data.roomStatusToday.occupied}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Disponibles</p>
                      <p className="text-xs text-muted-foreground">
                        {data.roomStatusToday.available}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Mantenimiento</p>
                      <p className="text-xs text-muted-foreground">
                        {data.roomStatusToday.maintenance}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rotación de habitaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Rotación de Habitaciones</CardTitle>
                <CardDescription>
                  Top 10 habitaciones con mayor actividad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rotationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="displayName"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value} estancias`,
                          "Rotación",
                        ]}
                        labelFormatter={(label, payload) =>
                          payload[0]?.payload
                            ? `${payload[0].payload.room} (${payload[0].payload.roomType})`
                            : label
                        }
                      />
                      <Bar dataKey="stays" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {data && (
        <Card className="border-t-4 border-t-purple-500">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {aiRecommendations.length > 0
                      ? "Recomendaciones IA"
                      : "Recomendaciones Inteligentes"}
                  </CardTitle>
                  <CardDescription className="text-purple-700 dark:text-purple-300">
                    {aiRecommendations.length > 0
                      ? "Sugerencias generadas por IA basadas en tus datos de habitaciones"
                      : "Sugerencias personalizadas basadas en tu análisis de habitaciones"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {aiRecommendations.length > 0 && (
                  <Button
                    onClick={() => setAiRecommendations([])}
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 hover:text-purple-800"
                  >
                    Mostrar originales
                  </Button>
                )}
                <Button
                  onClick={fetchAIRecommendations}
                  disabled={isLoadingAI}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Bot className="h-4 w-4" />
                  {isLoadingAI ? "Generando..." : "IA Avanzada"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingAI ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-purple-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Analizando datos con IA...
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-w-none">
                {aiRecommendations.length > 0 ? (
                  // Renderizar recomendaciones de IA con Markdown
                  <div className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 shadow-sm rounded-lg p-6">
                    <div className="ai-recommendations-content">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4 pb-2 border-b border-purple-300 dark:border-purple-700">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-3 mt-6 flex items-center gap-2">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-2 mt-4">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-purple-800 dark:text-purple-200 mb-3 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-4 space-y-1 text-purple-800 dark:text-purple-200 ml-4">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-4 space-y-1 text-purple-800 dark:text-purple-200 ml-4">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-purple-800 dark:text-purple-200 leading-relaxed">
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-purple-900 dark:text-purple-100">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-purple-700 dark:text-purple-300">
                              {children}
                            </em>
                          ),
                          hr: () => (
                            <hr className="border-purple-300 dark:border-purple-700 my-6" />
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-purple-400 pl-4 italic text-purple-700 dark:text-purple-300 my-4">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {aiRecommendations[0]}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  // Renderizar recomendaciones por defecto cuando no hay datos específicos
                  <div className="space-y-4">
                    <div className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-purple-800 dark:text-purple-200 leading-relaxed flex-1">
                          <strong>Optimización de mantenimiento:</strong> Con{" "}
                          {data.roomStatusToday.maintenance} habitaciones en
                          mantenimiento, considera programar tareas de
                          mantenimiento durante períodos de baja ocupación.
                        </div>
                      </div>
                    </div>

                    {data.rotation.length > 0 && (
                      <div className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 shadow-sm rounded-lg p-4">
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-purple-800 dark:text-purple-200 leading-relaxed flex-1">
                            <strong>Habitación más activa:</strong> La
                            habitación &ldquo;
                            {
                              data.rotation.sort((a, b) => b.stays - a.stays)[0]
                                ?.room
                            }
                            &rdquo; tiene la mayor rotación. Revisa si necesita
                            mantenimiento preventivo adicional.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-purple-800 dark:text-purple-200 leading-relaxed flex-1">
                          <strong>Maximizar disponibilidad:</strong> Con{" "}
                          {data.roomStatusToday.available} habitaciones
                          disponibles, considera estrategias de marketing para
                          aumentar la ocupación.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
