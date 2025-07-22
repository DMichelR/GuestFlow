"use client";

import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Bot,
  DollarSign,
  Users,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import type { ServicesAnalyticsData } from "@/types/dashboard";

export default function ServicesTab() {
  const [fromDate, setFromDate] = useState<Date>(subMonths(new Date(), 6));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [data, setData] = useState<ServicesAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Función para obtener datos de servicios - SIMPLIFICADA
  const fetchServicesData = async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);

    try {
      const fromStr = format(from, "yyyy-MM-dd");
      const toStr = format(to, "yyyy-MM-dd");

      // Obtener datos del período actual (ahora incluye datos históricos)
      const currentResponse = await fetch(
        `/api/tenantdashboard/analytics/services?from=${fromStr}&to=${toStr}`
      );

      if (!currentResponse.ok) {
        throw new Error(
          `Error ${currentResponse.status}: ${currentResponse.statusText}`
        );
      }

      const currentResult: ServicesAnalyticsData = await currentResponse.json();
      setData(currentResult);

      // Los datos históricos ahora vienen del backend
      setData(currentResult);

      // Ya no necesitamos datos históricos separados porque vienen del backend
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchServicesData(fromDate, toDate);
  }, [fromDate, toDate]);

  // Función para manejar el cambio de fechas
  const handleDateRangeUpdate = () => {
    fetchServicesData(fromDate, toDate);
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
    fetchServicesData(newFromDate, newToDate);
  };

  // Función para obtener recomendaciones de IA usando Gemini
  const fetchAIRecommendations = async () => {
    if (!data) return;

    setIsLoadingAI(true);
    try {
      const totalServiceIncome = data.incomeByDay.reduce(
        (sum, day) => sum + day.income,
        0
      );

      const servicesData = {
        topServices: data.topServices,
        avgConsumptionPerGuest: data.avgConsumptionPerGuest,
        totalIncomeFromServices: totalServiceIncome,
        daysAnalyzed: data.incomeByDay.length,
      };

      const recommendations = await aiService.getServicesRecommendations(
        servicesData
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
  const dailyIncomeChartData =
    data?.incomeByDay.map((item) => ({
      date: format(new Date(item.date), "dd/MM"),
      fullDate: format(new Date(item.date), "PPP", { locale: es }),
      income: item.income,
      formattedIncome: formatCurrency(item.income),
    })) || [];

  // Función para truncar nombres largos
  const truncateServiceName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + "...";
  };

  // Preparar datos de comparación para servicios más populares
  const createComparisonData = () => {
    if (!data || !data.topServices || data.topServices.length === 0) return [];

    const currentServices = data.topServices; // Mostrar todos los servicios

    const result = currentServices.map((currentService) => {
      const isTruncated = currentService.name.length > 15;

      const comparisonItem = {
        name: truncateServiceName(currentService.name), // Nombre truncado para el gráfico
        fullName: currentService.name, // Nombre completo para tooltips
        isTruncated, // Flag para indicar si está truncado
        currentCount: Math.max(0, currentService.count || 0), // Asegurar que no sea negativo
        historicalCount: Math.max(0, currentService.historicalCount || 0), // Usar datos del backend
        currentIncome: currentService.income || 0,
        historicalIncome: 0, // No tenemos este dato del backend aún
        formattedCurrentIncome: formatCurrency(currentService.income || 0),
        formattedHistoricalIncome: formatCurrency(0),
      };

      return comparisonItem;
    });

    // Filtrar servicios que tienen al menos un count > 0
    const filteredResult = result.filter(
      (item) => item.currentCount > 0 || item.historicalCount > 0
    );

    return filteredResult;
  };

  const comparisonChartData = createComparisonData();

  // Calcular métricas
  const totalServiceIncome =
    data?.incomeByDay.reduce((sum, day) => sum + day.income, 0) || 0;
  const avgDailyServiceIncome = data?.incomeByDay.length
    ? totalServiceIncome / data.incomeByDay.length
    : 0;
  const totalServicesCount =
    data?.topServices.reduce((sum, service) => sum + service.count, 0) || 0;

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
            Selecciona el período para analizar servicios
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
                Analizando datos de servicios...
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

      {/* Estado cuando no hay datos */}
      {!loading &&
        !error &&
        data &&
        (!data.topServices || data.topServices.length === 0) && (
          <Card>
            <CardContent className="p-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">
                  No hay datos de servicios disponibles
                </h3>
                <p className="text-muted-foreground max-w-md">
                  No se encontraron servicios en el rango de fechas
                  seleccionado. Intenta ajustar las fechas o verifica que haya
                  servicios registrados.
                </p>
                <Button
                  variant="outline"
                  onClick={() => handlePresetClick("1y")}
                >
                  Ver último año
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Datos principales */}
      {data && !loading && data.topServices && data.topServices.length > 0 && (
        <div className="grid gap-6">
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ingresos Totales
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalServiceIncome)}
                </div>
                <p className="text-xs text-muted-foreground">
                  En el período seleccionado ({data.incomeByDay.length} días)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Promedio Diario
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(avgDailyServiceIncome)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ingresos diarios en el período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Consumo por Huésped
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.avgConsumptionPerGuest)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Promedio en el período seleccionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Servicios
                </CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServicesCount}</div>
                <p className="text-xs text-muted-foreground">
                  Servicios consumidos en el período
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de ingresos diarios */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Diarios por Servicios</CardTitle>
                <CardDescription>
                  Evolución de ingresos por servicios a lo largo del tiempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyIncomeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value) =>
                          `$${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Ingresos",
                        ]}
                        labelFormatter={(label, payload) =>
                          payload[0]?.payload?.fullDate || label
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de servicios más populares */}
            <Card>
              <CardHeader>
                <CardTitle>Servicios Más Populares</CardTitle>
                <CardDescription>
                  Comparación entre período actual y total histórico - Todos los
                  servicios
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-80 text-center">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                      <Trophy className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      No hay datos de servicios
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      No se encontraron servicios en el período seleccionado.
                      Verifica que haya servicios registrados o ajusta el rango
                      de fechas.
                    </p>
                  </div>
                ) : (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparisonChartData}
                        margin={{ top: 0, right: 20, left: 20, bottom: -80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={160}
                          fontSize={12}
                          interval={0}
                          tick={{
                            fontSize: 12,
                            fontWeight: 500,
                            fill: "currentColor",
                          }}
                        />
                        <YAxis
                          allowDecimals={false}
                          domain={[0, "auto"]}
                          fontSize={12}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              // Buscar el nombre completo del servicio
                              const comparisonItem = comparisonChartData.find(
                                (item) => item.name === label
                              );
                              const fullName =
                                comparisonItem?.fullName || label;

                              return (
                                <div className="bg-white dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-[250px]">
                                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center border-b pb-2">
                                    {fullName}
                                  </p>
                                  <div className="space-y-2">
                                    {payload.map((entry, index: number) => {
                                      const isCurrentPeriod =
                                        entry.dataKey === "currentCount";
                                      const label = isCurrentPeriod
                                        ? "Período Actual"
                                        : "Total Histórico";
                                      const incomeValue = isCurrentPeriod
                                        ? comparisonItem?.formattedCurrentIncome
                                        : comparisonItem?.formattedHistoricalIncome;

                                      return (
                                        <div
                                          key={index}
                                          className="flex flex-col gap-1"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span
                                              className="font-medium text-sm"
                                              style={{ color: entry.color }}
                                            >
                                              {label}:
                                            </span>
                                            <span
                                              className="font-bold"
                                              style={{ color: entry.color }}
                                            >
                                              {entry.value} usos
                                            </span>
                                          </div>
                                          {incomeValue && (
                                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 ml-2">
                                              <span>Ingresos:</span>
                                              <span>{incomeValue}</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {/* Mostrar siempre la leyenda para ambas barras */}
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="rect"
                        />
                        <Bar
                          dataKey="currentCount"
                          fill="#10b981"
                          name="Período Actual"
                          radius={[4, 4, 0, 0]}
                          minPointSize={1}
                        />
                        {/* Mostrar siempre la barra histórica - no condicional */}
                        <Bar
                          dataKey="historicalCount"
                          fill="#6b7280"
                          name="Total Histórico"
                          radius={[4, 4, 0, 0]}
                          minPointSize={1}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Nota informativa para nombres truncados */}
                {comparisonChartData.some((item) => item.isTruncated) && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                      <svg
                        className="h-4 w-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        Algunos nombres de servicios están abreviados. Pasa el
                        cursor sobre las barras para ver el nombre completo.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {data && (
        <Card className="border-t-4 border-t-green-500 mt-6">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    {aiRecommendations.length > 0
                      ? "Recomendaciones IA"
                      : "Recomendaciones Inteligentes"}
                  </CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-300">
                    {aiRecommendations.length > 0
                      ? "Sugerencias generadas por IA basadas en tus datos de servicios"
                      : "Sugerencias personalizadas basadas en tu análisis de servicios"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {aiRecommendations.length > 0 && (
                  <Button
                    onClick={() => setAiRecommendations([])}
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-800"
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
                  <div className="w-8 h-8 border-4 border-green-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-4 border-green-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Analizando datos con IA...
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-w-none">
                {aiRecommendations.length > 0 ? (
                  // Renderizar recomendaciones de IA con Markdown
                  <div className="border border-green-200 bg-gradient-to-r from-green-50 to-teal-50 dark:border-green-800 dark:from-green-950 dark:to-teal-950 shadow-sm rounded-lg p-6">
                    <div className="ai-recommendations-content">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-4 pb-2 border-b border-green-300 dark:border-green-700">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-3 mt-6 flex items-center gap-2">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-medium text-green-700 dark:text-green-300 mb-2 mt-4">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-green-800 dark:text-green-200 mb-3 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-4 space-y-1 text-green-800 dark:text-green-200 ml-4">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-4 space-y-1 text-green-800 dark:text-green-200 ml-4">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-green-800 dark:text-green-200 leading-relaxed">
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-green-900 dark:text-green-100">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-green-700 dark:text-green-300">
                              {children}
                            </em>
                          ),
                          hr: () => (
                            <hr className="border-green-300 dark:border-green-700 my-6" />
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-green-400 pl-4 italic text-green-700 dark:text-green-300 my-4">
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
                    <div className="border border-green-200 bg-gradient-to-r from-green-50 to-teal-50 dark:border-green-800 dark:from-green-950 dark:to-teal-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-green-800 dark:text-green-200 leading-relaxed flex-1">
                          <strong>Optimización de servicios:</strong> Analiza
                          cuáles servicios generan más ingresos y enfócate en
                          promocionarlos activamente a los huéspedes.
                        </div>
                      </div>
                    </div>

                    {data.topServices.length > 0 && (
                      <div className="border border-green-200 bg-gradient-to-r from-green-50 to-teal-50 dark:border-green-800 dark:from-green-950 dark:to-teal-950 shadow-sm rounded-lg p-4">
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-green-800 dark:text-green-200 leading-relaxed flex-1">
                            <strong>Servicio destacado:</strong> &ldquo;
                            {data.topServices[0]?.name}&rdquo; es tu servicio
                            más popular. Considera crear paquetes o promociones
                            basadas en este servicio.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border border-green-200 bg-gradient-to-r from-green-50 to-teal-50 dark:border-green-800 dark:from-green-950 dark:to-teal-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-green-800 dark:text-green-200 leading-relaxed flex-1">
                          <strong>Incrementar consumo:</strong> Con un promedio
                          de {formatCurrency(data.avgConsumptionPerGuest)} por
                          huésped, considera estrategias para aumentar el
                          consumo de servicios.
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
