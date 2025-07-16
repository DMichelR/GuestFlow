"use client";

import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import {
  Calendar,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Bot,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

import type {
  OccupancyReportData,
  MonthlyOccupancyData,
  TodayOccupancyData,
  HistoricalOccupancyData,
} from "@/types/dashboard";

export default function OccupancyDashboard() {
  const [fromDate, setFromDate] = useState<Date>(subMonths(new Date(), 6));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [data, setData] = useState<OccupancyReportData | null>(null);
  const [todayData, setTodayData] = useState<TodayOccupancyData | null>(null);
  const [historicalData, setHistoricalData] =
    useState<HistoricalOccupancyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Función para obtener datos de ocupación
  const fetchOccupancyData = async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);

    try {
      const fromStr = format(from, "yyyy-MM-dd");
      const toStr = format(to, "yyyy-MM-dd");

      const response = await fetch(
        `/api/tenantdashboard/occupancy?fromDate=${fromStr}&toDate=${toStr}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: OccupancyReportData = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener ocupación de hoy
  const fetchTodayOccupancy = async () => {
    try {
      const response = await fetch(`/api/tenantdashboard/occupancy/today`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: TodayOccupancyData = await response.json();
      setTodayData(result);
    } catch (err) {
      console.error("Error fetching today's occupancy:", err);
    }
  };

  // Función para obtener ocupación histórica
  const fetchHistoricalOccupancy = async () => {
    try {
      const response = await fetch(`/api/tenantdashboard/occupancy/historical`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: HistoricalOccupancyData = await response.json();
      setHistoricalData(result);
    } catch (err) {
      console.error("Error fetching historical occupancy:", err);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchOccupancyData(fromDate, toDate);
    fetchTodayOccupancy();
    fetchHistoricalOccupancy();
  }, [fromDate, toDate]);

  // Función para manejar el cambio de fechas
  const handleDateRangeUpdate = () => {
    fetchOccupancyData(fromDate, toDate);
    fetchTodayOccupancy();
    fetchHistoricalOccupancy();
  };

  // Presets de fechas
  const handlePresetClick = (preset: string) => {
    const now = new Date();
    let newFromDate: Date;
    const newToDate = now;

    switch (preset) {
      case "3m":
        newFromDate = subMonths(now, 2);
        break;
      case "6m":
        newFromDate = subMonths(now, 5);
        break;
      case "1y":
        newFromDate = subMonths(now, 11);
        break;
      case "2y":
        newFromDate = subMonths(now, 23);
        break;
      default:
        return;
    }

    setFromDate(newFromDate);
    setToDate(newToDate);
    fetchOccupancyData(newFromDate, newToDate);
    fetchTodayOccupancy();
    fetchHistoricalOccupancy();
  };

  // Función para obtener recomendaciones de IA
  const fetchAIRecommendations = async () => {
    if (!data) return;

    setIsLoadingAI(true);
    try {
      // Crear un prompt contextual con los datos de ocupación
      const occupancyData = data.monthlyOccupancy
        .map(
          (item) =>
            `${item.monthName} ${
              item.year
            }: ${item.averageOccupancyPercentage.toFixed(1)}%`
        )
        .join(", ");

      const todayOccupancy = todayData
        ? todayData.occupancyPercentage.toFixed(1)
        : "N/A";
      const historicalOccupancy = historicalData
        ? historicalData.averageOccupancyPercentage.toFixed(1)
        : "N/A";

      const prompt = `Como experto consultor hotelero, analiza estos datos de ocupación y proporciona 3-5 recomendaciones específicas y accionables para mejorar el rendimiento del hotel:

Datos del hotel:
- Total de habitaciones: ${data.totalRooms}
- Ocupación actual (hoy): ${todayOccupancy}%
- Ocupación histórica promedio: ${historicalOccupancy}%
- Ocupación por meses: ${occupancyData}

Por favor, proporciona recomendaciones específicas, prácticas y enfocadas en resultados en formato Markdown. Usa títulos, listas y énfasis para estructurar la información de manera clara y profesional.

Formato esperado:
## 🎯 Recomendación 1: [Título]
**Situación:** Descripción del problema o oportunidad identificada.

**Acción requerida:**
- Acción específica 1
- Acción específica 2

**Resultado esperado:** Impacto estimado de implementar esta recomendación.

---

Continúa con el mismo formato para cada recomendación.`;

      console.log("Prompt enviado a la IA:", prompt);

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral",
          prompt: prompt,
          stream: false, // Cambiamos a false para obtener una respuesta completa
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Para las recomendaciones de IA, guardamos la respuesta completa en Markdown
      // como un solo string, no la dividimos
      setAiRecommendations([result.response.trim()]);
    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
      setAiRecommendations([
        "Error al obtener recomendaciones de IA. Verifica que Ollama esté ejecutándose en localhost:11434",
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Función para obtener el color basado en el porcentaje de ocupación
  const getBarColor = (percentage: number) => {
    if (percentage >= 85) return "hsl(142, 76%, 36%)"; // Verde esmeralda
    if (percentage >= 70) return "hsl(172, 62%, 50%)"; // Verde azulado vibrante
    if (percentage >= 50) return "hsl(48, 100%, 67%)"; // Amarillo dorado
    if (percentage >= 30) return "hsl(24, 100%, 64%)"; // Naranja vibrante
    return "hsl(0, 100%, 67%)"; // Rojo coral
  };

  // Preparar datos para el gráfico
  const chartData =
    data?.monthlyOccupancy.map((item: MonthlyOccupancyData) => ({
      name: item.monthName,
      ocupacion: item.averageOccupancyPercentage,
      fullName: `${item.monthName} ${item.year}`,
    })) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Análisis de Ocupación
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Visualiza el porcentaje de ocupación promedio por mes y obtén
          recomendaciones personalizadas para optimizar tu negocio.
        </p>
      </div>

      {/* Controles de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Rango de Fechas
          </CardTitle>
          <CardDescription>
            Selecciona el periodo para analizar la ocupación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Presets de fechas */}
            <div className="flex flex-wrap gap-2">
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
                        !fromDate && "text-muted-foreground"
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
                      disabled={(date) => date > toDate || date > new Date()}
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
                        !toDate && "text-muted-foreground"
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
                      disabled={(date) => date < fromDate || date > new Date()}
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
                <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="text-muted-foreground font-medium">
                Analizando datos de ocupación...
              </p>
              <p className="text-sm text-muted-foreground">
                Esto puede tomar unos segundos
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {error && (
        <Alert
          variant="destructive"
          className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 dark:border-red-800 dark:from-red-950 dark:to-pink-950"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            <span className="block mb-1">Error al cargar los datos</span>
            <span className="text-sm opacity-90">{error}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Datos vacíos */}
      {!loading && !error && data && data.monthlyOccupancy.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <CalendarDays className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                No hay datos disponibles
              </h3>
              <p className="text-muted-foreground max-w-md">
                No se encontraron estancias en el rango de fechas seleccionado.
                Intenta ajustar las fechas o verifica que haya reservas
                registradas.
              </p>
              <Button variant="outline" onClick={() => handlePresetClick("1y")}>
                Ver último año
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas y Gráfico */}
      {data && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          {/* Columna izquierda - Cards de estadísticas */}
          <div className="xl:col-span-1 space-y-4 h-full">
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-200 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Total de Habitaciones
                    </p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                      {data.totalRooms}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-500 rounded-full">
                    <CalendarDays className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Ocupación de Hoy
                    </p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {todayData
                        ? `${todayData.occupancyPercentage.toFixed(1)}%`
                        : "Cargando..."}
                    </p>
                  </div>
                  <div className="p-2 bg-green-500 rounded-full">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Ocupación Histórica
                    </p>
                    <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                      {historicalData
                        ? `${historicalData.averageOccupancyPercentage.toFixed(
                            1
                          )}%`
                        : "Cargando..."}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-500 rounded-full">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Meses Analizados
                    </p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                      {data.monthlyOccupancy.length}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-500 rounded-full">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Gráfico */}
          <div className="xl:col-span-4 h-full">
            <Card className="border-t-4 border-t-indigo-500 h-full flex flex-col">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-500 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent text-lg">
                    Ocupación Mensual
                  </span>
                </CardTitle>
                <CardDescription className="text-indigo-700 dark:text-indigo-300 text-sm">
                  Porcentaje de ocupación promedio por mes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 flex-1 flex flex-col">
                <div className="flex-1 min-h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 15, left: 8, bottom: 15 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(1)}%`,
                          "Ocupación",
                        ]}
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.name === label);
                          return item?.fullName || label;
                        }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="ocupacion" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getBarColor(entry.ocupacion)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Leyenda de colores */}
                <div className="mt-4 flex flex-wrap gap-4 justify-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getBarColor(90) }}
                    ></div>
                    <span className="text-sm text-muted-foreground">
                      Excelente (85%+)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getBarColor(75) }}
                    ></div>
                    <span className="text-sm text-muted-foreground">
                      Muy bueno (70-84%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getBarColor(60) }}
                    ></div>
                    <span className="text-sm text-muted-foreground">
                      Bueno (50-69%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getBarColor(40) }}
                    ></div>
                    <span className="text-sm text-muted-foreground">
                      Regular (30-49%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getBarColor(20) }}
                    ></div>
                    <span className="text-sm text-muted-foreground">
                      Bajo (&lt;30%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {data &&
        (data.recommendations.length > 0 || aiRecommendations.length > 0) && (
          <Card className="border-t-4 border-t-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {aiRecommendations.length > 0
                        ? "Recomendaciones IA"
                        : "Recomendaciones Inteligentes"}
                    </CardTitle>
                    <CardDescription className="text-blue-700 dark:text-blue-300">
                      {aiRecommendations.length > 0
                        ? "Sugerencias generadas por IA basadas en tus datos"
                        : "Sugerencias personalizadas basadas en tu análisis de ocupación"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {aiRecommendations.length > 0 && (
                    <Button
                      onClick={() => setAiRecommendations([])}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
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
                    <div className="w-8 h-8 border-4 border-blue-200 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Analizando datos con IA...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-none">
                  {aiRecommendations.length > 0 ? (
                    // Renderizar recomendaciones de IA con Markdown
                    <div className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950 shadow-sm rounded-lg p-6">
                      <div className="ai-recommendations-content">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4 pb-2 border-b border-blue-300 dark:border-blue-700">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-3 mt-6 flex items-center gap-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2 mt-4">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-blue-800 dark:text-blue-200 mb-3 leading-relaxed">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-4 space-y-1 text-blue-800 dark:text-blue-200 ml-4">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-4 space-y-1 text-blue-800 dark:text-blue-200 ml-4">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-blue-800 dark:text-blue-200 leading-relaxed">
                                {children}
                              </li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-blue-900 dark:text-blue-100">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-blue-700 dark:text-blue-300">
                                {children}
                              </em>
                            ),
                            hr: () => (
                              <hr className="border-blue-300 dark:border-blue-700 my-6" />
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-blue-400 pl-4 italic text-blue-700 dark:text-blue-300 my-4">
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
                    // Renderizar recomendaciones normales
                    data.recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950 shadow-sm rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-blue-800 dark:text-blue-200 leading-relaxed flex-1">
                            {recommendation}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
