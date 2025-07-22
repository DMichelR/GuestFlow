"use client";

import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import {
  CalendarDays,
  DollarSign,
  TrendingDown,
  AlertCircle,
  Bot,
  X,
  CreditCard,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { aiService } from "@/lib/aiService";
import type {
  IncomeAndCancellationsData,
  DailyIncomeData,
} from "@/types/dashboard";

export default function IncomeTab() {
  const [fromDate, setFromDate] = useState<Date>(subMonths(new Date(), 6));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [data, setData] = useState<IncomeAndCancellationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Función para obtener datos de ingresos y cancelaciones
  const fetchIncomeData = async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);

    try {
      const fromStr = format(from, "yyyy-MM-dd");
      const toStr = format(to, "yyyy-MM-dd");

      const response = await fetch(
        `/api/tenantdashboard/income-and-cancellations?from=${fromStr}&to=${toStr}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: IncomeAndCancellationsData = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchIncomeData(fromDate, toDate);
  }, [fromDate, toDate]);

  // Función para manejar el cambio de fechas
  const handleDateRangeUpdate = () => {
    fetchIncomeData(fromDate, toDate);
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
    fetchIncomeData(newFromDate, newToDate);
  };

  // Función para obtener recomendaciones de IA usando Gemini
  const fetchAIRecommendations = async () => {
    if (!data) return;

    setIsLoadingAI(true);
    try {
      const totalIncome = data.incomeDaily.reduce(
        (sum, day) => sum + day.total,
        0
      );

      const incomeData = {
        totalIncome,
        cancelStats: data.cancelStats,
        historicalCancellationPercentage: data.historicalCancellationPercentage,
        visitReasonCancellations: data.visitReasonCancellations,
        dailyIncomeLength: data.incomeDaily.length,
      };

      const recommendations = await aiService.getIncomeRecommendations(
        incomeData
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

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Preparar datos para gráficos
  const chartData =
    data?.incomeDaily.map((item: DailyIncomeData, index) => {
      const processedItem = {
        date: format(new Date(item.date), "dd/MM"),
        fullDate: format(new Date(item.date), "PPP", { locale: es }),
        income: item.total,
        formattedIncome: formatCurrency(item.total),
        originalData: item, // Para debugging
        index: index, // Para debugging
      };

      return processedItem;
    }) || [];

  // Debug: Log final del chartData (movido al useEffect)

  // Datos para el gráfico de cancelaciones por razón
  const cancellationData =
    data?.visitReasonCancellations.map((item, index) => {
      // Paleta de colores más atractivos, evitando amarillo
      const colors = [
        "#ef4444", // rojo
        "#3b82f6", // azul
        "#10b981", // verde
        "#8b5cf6", // violeta
        "#f97316", // naranja
        "#06b6d4", // cyan
        "#84cc16", // lime
        "#ec4899", // pink
      ];
      return {
        name: item.visitReasonName,
        value: item.cancelledCount,
        color: colors[index % colors.length],
      };
    }) || [];

  // Calcular métricas
  const totalIncome =
    data?.incomeDaily.reduce((sum, day) => sum + day.total, 0) || 0;
  const avgDailyIncome = data?.incomeDaily.length
    ? totalIncome / data.incomeDaily.length
    : 0;
  const maxDailyIncome = Math.max(
    ...(data?.incomeDaily.map((d) => d.total) || [0])
  );
  const minDailyIncome = Math.min(
    ...(data?.incomeDaily.map((d) => d.total) || [0])
  );

  return (
    <div className="space-y-6">
      {/* Controles de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Rango de Fechas
          </CardTitle>
          <CardDescription>
            Selecciona el período para analizar ingresos y cancelaciones
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
                <div className="w-12 h-12 border-4 border-green-200 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-green-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="text-muted-foreground font-medium">
                Analizando datos financieros...
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
        <Alert
          variant="destructive"
          className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 dark:border-red-800 dark:from-red-950 dark:to-pink-950"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            <span className="block mb-1">
              Error al cargar los datos financieros
            </span>
            <span className="text-sm opacity-90">{error}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Datos vacíos */}
      {!loading && !error && data && data.incomeDaily.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                No hay datos financieros disponibles
              </h3>
              <p className="text-muted-foreground max-w-md">
                No se encontraron ingresos en el rango de fechas seleccionado.
                Intenta ajustar las fechas o verifica que haya transacciones
                registradas.
              </p>
              <Button variant="outline" onClick={() => handlePresetClick("1y")}>
                Ver último año
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principales */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Ingresos Totales
                  </p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <div className="p-2 bg-green-500 rounded-full">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Promedio Diario
                  </p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {formatCurrency(avgDailyIncome)}
                  </p>
                </div>
                <div className="p-2 bg-blue-500 rounded-full">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Tasa de Cancelación Histórica
                  </p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                    {data.historicalCancellationPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Período actual: {data.cancelStats.percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-red-500 rounded-full">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Total Cancelaciones
                  </p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {data.cancelStats.count}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    En el período seleccionado
                  </p>
                </div>
                <div className="p-2 bg-purple-500 rounded-full">
                  <X className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      {data && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Gráfico de ingresos diarios */}
          <div className="xl:col-span-2">
            <Card className="border-t-4 border-t-green-500 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-1.5 bg-green-500 rounded-lg">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Ingresos Diarios
                  </span>
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Evolución de los ingresos por día
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) =>
                          `$${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Ingresos",
                        ]}
                        labelFormatter={(label, payload) => {
                          // Usar el payload para obtener el dato correcto
                          if (payload && payload.length > 0) {
                            const dataIndex = payload[0]?.payload;
                            return dataIndex?.fullDate || label;
                          }
                          // Fallback: buscar por fecha
                          const item = chartData.find((d) => d.date === label);
                          return item?.fullDate || label;
                        }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={3}
                        dot={{
                          fill: "hsl(142, 76%, 36%)",
                          strokeWidth: 2,
                          r: 4,
                        }}
                        activeDot={{
                          r: 6,
                          stroke: "hsl(142, 76%, 36%)",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de cancelaciones por razón */}
          <Card className="border-t-4 border-t-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-1.5 bg-red-500 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Cancelaciones por Tipo
                </span>
              </CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                Distribución por razón de visita
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-4 items-center">
                {/* Leyenda a la izquierda centrada verticalmente */}
                <div className="flex-shrink-0 w-40 space-y-2 flex flex-col justify-center">
                  {cancellationData.map((entry, index) => (
                    <div
                      key={`legend-${index}`}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs font-medium truncate">
                          {entry.name}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground">
                          {entry.value}
                        </span>
                        <span className="text-xs font-medium text-red-600">
                          {data.cancelStats.count > 0
                            ? (
                                (entry.value / data.cancelStats.count) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gráfico a la derecha */}
                <div className="flex-1 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cancellationData}
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={45}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {cancellationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value} cancelaciones`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tasa del período actual abajo */}
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    Tasa de cancelación en el período:
                  </span>
                  <span className="text-lg font-bold text-red-800 dark:text-red-200">
                    {data.cancelStats.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-red-600 dark:text-red-400">
                    Total de cancelaciones:
                  </span>
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    {data.cancelStats.count}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recomendaciones */}
      {data && (
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {aiRecommendations.length > 0
                      ? "Recomendaciones Financieras IA"
                      : "Recomendaciones Inteligentes"}
                  </CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-300">
                    {aiRecommendations.length > 0
                      ? "Sugerencias generadas por IA para optimizar ingresos"
                      : "Sugerencias para mejorar el rendimiento financiero"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {aiRecommendations.length > 0 && (
                  <Button
                    onClick={() => setAiRecommendations([])}
                    variant="ghost"
                    size="sm"
                    className="text-amber-600 hover:text-amber-800"
                  >
                    Mostrar básicas
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
                  <div className="w-8 h-8 border-4 border-amber-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-4 border-amber-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Analizando datos financieros con IA...
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-w-none">
                {aiRecommendations.length > 0 ? (
                  // Renderizar recomendaciones de IA con Markdown
                  <div className="border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950 dark:to-orange-950 shadow-sm rounded-lg p-6">
                    <div className="ai-recommendations-content">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-4 pb-2 border-b border-amber-300 dark:border-amber-700">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-3 mt-6 flex items-center gap-2">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-medium text-amber-700 dark:text-amber-300 mb-2 mt-4">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-amber-800 dark:text-amber-200 mb-3 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-4 space-y-1 text-amber-800 dark:text-amber-200 ml-4">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-4 space-y-1 text-amber-800 dark:text-amber-200 ml-4">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-amber-800 dark:text-amber-200 leading-relaxed">
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-amber-900 dark:text-amber-100">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-amber-700 dark:text-amber-300">
                              {children}
                            </em>
                          ),
                          hr: () => (
                            <hr className="border-amber-300 dark:border-amber-700 my-6" />
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-amber-400 pl-4 italic text-amber-700 dark:text-amber-300 my-4">
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
                  // Renderizar recomendaciones básicas generadas desde los datos
                  <div className="space-y-3">
                    {/* Recomendación sobre cancelaciones */}
                    {data.cancelStats.percentage >
                      data.historicalCancellationPercentage && (
                      <div className="border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950 dark:to-orange-950 shadow-sm rounded-lg p-4">
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-amber-800 dark:text-amber-200 leading-relaxed flex-1">
                            <strong>Alta tasa de cancelación:</strong> Tu tasa
                            actual de {data.cancelStats.percentage.toFixed(1)}%
                            está por encima del promedio histórico (
                            {data.historicalCancellationPercentage.toFixed(1)}
                            %). Considera revisar las políticas de cancelación y
                            mejorar la confirmación de reservas.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recomendación sobre ingresos */}
                    <div className="border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950 dark:to-orange-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-amber-800 dark:text-amber-200 leading-relaxed flex-1">
                          <strong>Análisis de ingresos:</strong> Tu promedio
                          diario de ingresos es {formatCurrency(avgDailyIncome)}
                          . El día con mayores ingresos fue{" "}
                          {formatCurrency(maxDailyIncome)} y el menor{" "}
                          {formatCurrency(minDailyIncome)}. Analiza los factores
                          que influyeron en los días de mejores resultados.
                        </div>
                      </div>
                    </div>

                    {/* Recomendación sobre principales razones de cancelación */}
                    {data.visitReasonCancellations.length > 0 && (
                      <div className="border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950 dark:to-orange-950 shadow-sm rounded-lg p-4">
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-amber-800 dark:text-amber-200 leading-relaxed flex-1">
                            <strong>Principales cancelaciones:</strong> El tipo
                            de visita &ldquo;
                            {data.visitReasonCancellations[0]?.visitReasonName}
                            &rdquo; tiene{" "}
                            {
                              data.visitReasonCancellations[0]?.cancelledCount
                            }{" "}
                            cancelaciones. Enfócate en mejorar la experiencia
                            para este segmento.
                          </div>
                        </div>
                      </div>
                    )}
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
