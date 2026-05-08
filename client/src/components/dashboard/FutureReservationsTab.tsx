"use client";

import { useState, useEffect } from "react";
import { format, addDays, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import {
  Calendar,
  CalendarDays,
  Calendar as CalendarIcon,
  TrendingUp,
  AlertCircle,
  Bot,
  Clock,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import { aiService } from "@/lib/aiService";
import { useDebouncedCallback } from "@/lib/useDebouncedCallback";
import type { FutureReservationsData } from "@/types/dashboard";

export default function FutureReservationsTab() {
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(addWeeks(new Date(), 8));
  const [data, setData] = useState<FutureReservationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Función para obtener datos de reservas futuras
  const fetchFutureReservationsData = async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);

    try {
      const fromStr = format(from, "yyyy-MM-dd");
      const toStr = format(to, "yyyy-MM-dd");

      const response = await fetch(
        `/api/tenantdashboard/future-reservations?futureFrom=${fromStr}&futureTo=${toStr}`,
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: FutureReservationsData = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchFutureReservationsData(fromDate, toDate);
  }, [fromDate, toDate]);

  // Función para manejar el cambio de fechas
  const handleDateRangeUpdate = () => {
    fetchFutureReservationsData(fromDate, toDate);
  };

  // Presets de fechas
  const handlePresetClick = (preset: string) => {
    const now = new Date();
    let newFromDate: Date;
    let newToDate: Date;

    switch (preset) {
      case "1m":
        newFromDate = now;
        newToDate = addDays(now, 30);
        break;
      case "3m":
        newFromDate = now;
        newToDate = addDays(now, 90);
        break;
      case "6m":
        newFromDate = now;
        newToDate = addDays(now, 180);
        break;
      case "1y":
        newFromDate = now;
        newToDate = addDays(now, 365);
        break;
      case "2y":
        newFromDate = now;
        newToDate = addDays(now, 730);
        break;
      case "historico":
        // Para futuras reservas, "histórico" significa desde hoy hasta muy lejos en el futuro
        newFromDate = now;
        newToDate = addDays(now, 1095); // 3 años
        break;
      default:
        return;
    }

    setFromDate(newFromDate);
    setToDate(newToDate);
    fetchFutureReservationsData(newFromDate, newToDate);
  };

  // Función para obtener recomendaciones de IA usando Gemini
  const fetchAIRecommendations = async () => {
    if (!data) return;

    setIsLoadingAI(true);
    try {
      const totalReservations = data.reservationsByWeek.reduce(
        (sum, week) => sum + week.reservations,
        0,
      );
      const avgWeeklyReservations =
        totalReservations / data.reservationsByWeek.length;
      const maxWeeklyReservations = Math.max(
        ...data.reservationsByWeek.map((w) => w.reservations),
      );
      const minWeeklyReservations = Math.min(
        ...data.reservationsByWeek.map((w) => w.reservations),
      );

      const weeksData = data.reservationsByWeek
        .map((week) => `${week.week}: ${week.reservations} reservas`)
        .join(", ");

      const reservationsData = {
        totalReservations,
        averageWeeklyReservations: avgWeeklyReservations,
        maxWeeklyReservations,
        minWeeklyReservations,
        weeksData,
        weeksAnalyzed: data.reservationsByWeek.length,
      };

      const recommendations =
        await aiService.getFutureReservationsRecommendations(reservationsData);
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

  const debouncedFetchAIRecommendations = useDebouncedCallback(
    fetchAIRecommendations,
    1000,
  );

  // Función para convertir formato de semana ISO a rango de fechas legible
  const formatWeekRange = (weekString: string) => {
    try {
      // Formato entrada: "2025-W30"
      const [year, weekNumber] = weekString.split("-W");
      const yearNum = parseInt(year);
      const weekNum = parseInt(weekNumber);

      // Calcular la fecha del primer día de la semana (lunes)
      const firstDayOfYear = new Date(yearNum, 0, 1);
      const dayOfWeek = firstDayOfYear.getDay();
      const daysToFirstMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const firstMonday = new Date(yearNum, 0, 1 + daysToFirstMonday);

      // Calcular la fecha de inicio de la semana específica
      const startDate = new Date(firstMonday);
      startDate.setDate(firstMonday.getDate() + (weekNum - 1) * 7);

      // Calcular la fecha de fin de la semana (domingo)
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      // Formatear las fechas
      const startFormatted = format(startDate, "dd/MM", { locale: es });
      const endFormatted = format(endDate, "dd/MM", { locale: es });

      return `${startFormatted} - ${endFormatted}`;
    } catch {
      // Si hay error, devolver el formato original
      return weekString;
    }
  };

  // Preparar datos para gráficos
  const chartData =
    data?.reservationsByWeek.map((item) => ({
      week: item.week,
      weekFormatted: formatWeekRange(item.week),
      reservations: item.reservations,
    })) || [];

  // Calcular métricas
  const totalReservations =
    data?.reservationsByWeek.reduce(
      (sum, week) => sum + week.reservations,
      0,
    ) || 0;
  const avgWeeklyReservations = data?.reservationsByWeek.length
    ? totalReservations / data.reservationsByWeek.length
    : 0;
  const maxWeeklyReservations = data?.reservationsByWeek.length
    ? Math.max(...data.reservationsByWeek.map((w) => w.reservations))
    : 0;
  const minWeeklyReservations = data?.reservationsByWeek.length
    ? Math.min(...data.reservationsByWeek.map((w) => w.reservations))
    : 0;

  return (
    <div className="space-y-6">
      {/* Controles de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Rango de Fechas Futuras
          </CardTitle>
          <CardDescription>
            Selecciona el período para analizar reservas futuras
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
                Próximo mes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("3m")}
              >
                Próximos 3 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("6m")}
              >
                Próximos 6 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("1y")}
              >
                Próximo año
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("2y")}
              >
                Próximos 2 años
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("historico")}
              >
                Todas las futuras
              </Button>
            </div>

            {/* Selectores de fecha */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {fromDate
                        ? format(fromDate, "PPP", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={fromDate}
                      onSelect={(date) => date && setFromDate(date)}
                      disabled={(date) => date < new Date() || date > toDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !toDate && "text-muted-foreground",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {toDate
                        ? format(toDate, "PPP", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={toDate}
                      onSelect={(date) => date && setToDate(date)}
                      disabled={(date) => date < fromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="text-muted-foreground font-medium">
                Analizando reservas futuras...
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
            <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Reservas
                </CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReservations}</div>
                <p className="text-xs text-muted-foreground">
                  En las próximas {data.reservationsByWeek.length} semanas
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Promedio Semanal
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgWeeklyReservations.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reservas por semana
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Semana Pico
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {maxWeeklyReservations}
                </div>
                <p className="text-xs text-muted-foreground">
                  Máximas reservas semanales
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Semana Baja
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {minWeeklyReservations}
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimas reservas semanales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de reservas por semana */}
          <Card>
            <CardHeader>
              <CardTitle>Reservas por Semana</CardTitle>
              <CardDescription>
                Distribución de reservas futuras a lo largo del tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="weekFormatted"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} reservas`, "Reservas"]}
                      labelFormatter={(label) => `Semana: ${label}`}
                      labelStyle={{ color: "#000" }}
                    />
                    <Bar
                      dataKey="reservations"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recomendaciones */}
      {data && (
        <Card className="border-t-4 border-t-indigo-500">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {aiRecommendations.length > 0
                      ? "Recomendaciones IA"
                      : "Recomendaciones Inteligentes"}
                  </CardTitle>
                  <CardDescription className="text-indigo-700 dark:text-indigo-300">
                    {aiRecommendations.length > 0
                      ? "Sugerencias generadas por IA basadas en tus reservas futuras"
                      : "Sugerencias personalizadas basadas en tu análisis de reservas"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {aiRecommendations.length > 0 && (
                  <Button
                    onClick={() => setAiRecommendations([])}
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Mostrar originales
                  </Button>
                )}
                <Button
                  onClick={debouncedFetchAIRecommendations}
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
                  <div className="w-8 h-8 border-4 border-indigo-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Analizando datos con IA...
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-w-none">
                {aiRecommendations.length > 0 ? (
                  // Renderizar recomendaciones de IA con Markdown
                  <div className="border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:border-indigo-800 dark:from-indigo-950 dark:to-purple-950 shadow-sm rounded-lg p-6">
                    <div className="ai-recommendations-content">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-4 pb-2 border-b border-indigo-300 dark:border-indigo-700">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200 mb-3 mt-6 flex items-center gap-2">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-medium text-indigo-700 dark:text-indigo-300 mb-2 mt-4">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-indigo-800 dark:text-indigo-200 mb-3 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-4 space-y-1 text-indigo-800 dark:text-indigo-200 ml-4">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-4 space-y-1 text-indigo-800 dark:text-indigo-200 ml-4">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-indigo-800 dark:text-indigo-200 leading-relaxed">
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-indigo-900 dark:text-indigo-100">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-indigo-700 dark:text-indigo-300">
                              {children}
                            </em>
                          ),
                          hr: () => (
                            <hr className="border-indigo-300 dark:border-indigo-700 my-6" />
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-indigo-400 pl-4 italic text-indigo-700 dark:text-indigo-300 my-4">
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
                    <div className="border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:border-indigo-800 dark:from-indigo-950 dark:to-purple-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-indigo-800 dark:text-indigo-200 leading-relaxed flex-1">
                          <strong>Planificación anticipada:</strong> Usa los
                          datos de reservas futuras para optimizar la asignación
                          de personal y gestión de inventarios.
                        </div>
                      </div>
                    </div>

                    {data.reservationsByWeek.length > 0 && (
                      <div className="border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:border-indigo-800 dark:from-indigo-950 dark:to-purple-950 shadow-sm rounded-lg p-4">
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-indigo-800 dark:text-indigo-200 leading-relaxed flex-1">
                            <strong>Gestión de demanda:</strong> Las semanas con
                            pocas reservas son oportunidades para promociones
                            especiales y marketing dirigido.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:border-indigo-800 dark:from-indigo-950 dark:to-purple-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-indigo-800 dark:text-indigo-200 leading-relaxed flex-1">
                          <strong>Optimización de precios:</strong> Ajusta las
                          tarifas basándote en la demanda proyectada para
                          maximizar los ingresos.
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
