"use client";

import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  CalendarDays,
  Users,
  AlertCircle,
  Bot,
  MapPin,
  Globe,
  Star,
  Clock,
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
import type { GuestsAnalyticsData } from "@/types/dashboard";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function GuestsTab() {
  const [fromDate, setFromDate] = useState<Date>(subMonths(new Date(), 1));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [data, setData] = useState<GuestsAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string>("");
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const fetchData = async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        from: format(from, "yyyy-MM-dd"),
        to: format(to, "yyyy-MM-dd"),
      });

      const response = await fetch(
        `/api/tenantdashboard/analytics/guests?${params}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchData(fromDate, toDate);
  }, [fromDate, toDate]);

  // Función para manejar el cambio de fechas
  const handleDateRangeUpdate = () => {
    fetchData(fromDate, toDate);
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
    fetchData(newFromDate, newToDate);
  };

  const generateRecommendations = async () => {
    if (!data) return;

    setLoadingRecommendations(true);
    try {
      const guestsData = {
        frequentGuests: data.frequentGuests,
        longStays: data.longStays,
        cities: data.cities,
        countries: data.countries,
      };

      const recommendations = await aiService.getGuestsRecommendations(
        guestsData
      );
      setRecommendations(
        recommendations[0] || "No se pudieron generar recomendaciones."
      );
    } catch {
      setRecommendations(
        "Error al generar recomendaciones. Verifica tu configuración de Gemini API."
      );
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchData(fromDate, toDate);
  }, [fromDate, toDate]);

  // Preparar datos para gráficos
  const topCitiesData = data?.cities || [];
  const topCountriesData = data?.countries || [];
  const frequentGuestsData = data?.frequentGuests
    ? [...data.frequentGuests].sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const longStaysData = data?.longStays
    ? [...data.longStays].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Rango de Fechas para Análisis
          </CardTitle>
          <CardDescription>
            Selecciona el período para analizar patrones de huéspedes
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
                Último mes
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

      {/* Estado de carga y error */}
      {loading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Cargando datos de huéspedes...</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
      )}

      {/* Métricas principales */}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Huéspedes Únicos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.frequentGuests.length + data.longStays.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  En el período seleccionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Huéspedes Frecuentes
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.frequentGuests.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Con múltiples estadías
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ciudades de Origen
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.cities.length}</div>
                <p className="text-xs text-muted-foreground">
                  Diversidad geográfica
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Países Representados
                </CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.countries.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Alcance internacional
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Huéspedes Frecuentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Top Huéspedes Frecuentes
                </CardTitle>
                <CardDescription>
                  Huéspedes con más estadías en el período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={frequentGuestsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="stays" fill="#0088FE" name="Estadías" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Ciudades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Distribución por Ciudades
                </CardTitle>
                <CardDescription>
                  Principales ciudades de origen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topCitiesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ city, percent }) =>
                        `${city} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                    >
                      {topCitiesData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Países */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Top Países de Origen
                </CardTitle>
                <CardDescription>
                  Principales mercados internacionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCountriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="country"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00C49F" name="Huéspedes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Estadías Largas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Estadías Más Largas
                </CardTitle>
                <CardDescription>
                  Huéspedes con estadías prolongadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={longStaysData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="days" fill="#FFBB28" name="Días" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sección de Recomendaciones */}
          <Card className="border-t-4 border-t-cyan-500">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950 dark:to-teal-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500 rounded-lg">
                    <BarChart2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                      {recommendations
                        ? "Recomendaciones IA"
                        : "Recomendaciones Inteligentes"}
                    </CardTitle>
                    <CardDescription className="text-cyan-700 dark:text-cyan-300">
                      {recommendations
                        ? "Sugerencias generadas por IA para optimizar gestión de huéspedes"
                        : "Análisis y sugerencias basadas en los datos de huéspedes"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {recommendations && (
                    <Button
                      onClick={() => setRecommendations("")}
                      variant="ghost"
                      size="sm"
                      className="text-cyan-600 hover:text-cyan-800"
                    >
                      Mostrar básicas
                    </Button>
                  )}
                  <Button
                    onClick={generateRecommendations}
                    disabled={loadingRecommendations}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    {loadingRecommendations ? "Generando..." : "IA Avanzada"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations && (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{recommendations}</ReactMarkdown>
                </div>
              )}

              {!recommendations && !loadingRecommendations && data && (
                <div className="space-y-4">
                  {/* Recomendaciones básicas basadas en datos */}
                  {data.frequentGuests.length > 0 && (
                    <div className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-purple-800 dark:text-purple-200 leading-relaxed flex-1">
                          <strong>Programa de Fidelización:</strong> Tienes{" "}
                          {data.frequentGuests.length} huéspedes frecuentes.
                          Considera implementar un programa de recompensas o
                          descuentos especiales para mantener su lealtad.
                        </div>
                      </div>
                    </div>
                  )}

                  {data.longStays.length > 0 && (
                    <div className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-purple-800 dark:text-purple-200 leading-relaxed flex-1">
                          <strong>Estadías Prolongadas:</strong>{" "}
                          {data.longStays.length} huéspedes han tenido estadías
                          largas. Ofrece tarifas especiales por estadías
                          extendidas para atraer más huéspedes de largo plazo.
                        </div>
                      </div>
                    </div>
                  )}

                  {data.countries.length > 5 && (
                    <div className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-purple-800 dark:text-purple-200 leading-relaxed flex-1">
                          <strong>Diversidad Internacional:</strong> Recibes
                          huéspedes de {data.countries.length} países
                          diferentes. Considera ofrecer servicios multilingües y
                          información turística variada.
                        </div>
                      </div>
                    </div>
                  )}

                  {data.cities.length > 10 && (
                    <div className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 shadow-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-purple-800 dark:text-purple-200 leading-relaxed flex-1">
                          <strong>Alcance Geográfico Amplio:</strong> Atraes
                          huéspedes de {data.cities.length} ciudades distintas.
                          Implementa estrategias de marketing digital dirigidas
                          a estas ubicaciones clave.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!recommendations && !loadingRecommendations && !data && (
                <div className="text-muted-foreground">
                  Carga datos para ver recomendaciones automáticas basadas en el
                  análisis de huéspedes.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
