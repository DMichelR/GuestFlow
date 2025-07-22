// AI Service usando Google Gemini API
import { GoogleGenAI } from "@google/genai";

export interface AIRecommendationRequest {
  prompt: string;
  context?: Record<string, unknown>;
}

export class AIService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "NEXT_PUBLIC_GEMINI_API_KEY no está configurada en las variables de entorno"
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async getRecommendations(
    request: AIRecommendationRequest
  ): Promise<string[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: request.prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // Disables thinking
          },
        },
      });

      const text = response.text || "";
      return [text.trim()];
    } catch (error) {
      console.error("Error al obtener recomendaciones de IA:", error);
      throw new Error(
        "Error al obtener recomendaciones de IA. Verifica tu configuración de Gemini API"
      );
    }
  }

  // Métodos específicos para cada tipo de análisis
  async getOccupancyRecommendations(occupancyData: {
    totalRooms: number;
    todayOccupancy?: number;
    historicalOccupancy?: number;
    monthlyOccupancy: Array<{
      monthName: string;
      year: number;
      averageOccupancyPercentage: number;
    }>;
  }): Promise<string[]> {
    const occupancyByMonth = occupancyData.monthlyOccupancy
      .map(
        (item) =>
          `${item.monthName} ${
            item.year
          }: ${item.averageOccupancyPercentage.toFixed(1)}%`
      )
      .join(", ");

    const todayOccupancy = occupancyData.todayOccupancy?.toFixed(1) || "N/A";
    const historicalOccupancy =
      occupancyData.historicalOccupancy?.toFixed(1) || "N/A";

    const prompt = `Como experto consultor hotelero, analiza estos datos de ocupación y proporciona 3-5 recomendaciones específicas y accionables para mejorar el rendimiento del hotel:

Datos del hotel:
- Total de habitaciones: ${occupancyData.totalRooms}
- Ocupación actual (hoy): ${todayOccupancy}%
- Ocupación histórica promedio: ${historicalOccupancy}%
- Ocupación por meses: ${occupancyByMonth}

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

    return this.getRecommendations({ prompt });
  }

  async getIncomeRecommendations(incomeData: {
    totalIncome: number;
    cancelStats: {
      count: number;
      percentage: number;
    };
    historicalCancellationPercentage?: number;
    visitReasonCancellations: Array<{
      visitReasonName: string;
      cancelledCount: number;
    }>;
    dailyIncomeLength: number;
  }): Promise<string[]> {
    const cancellationReasons = incomeData.visitReasonCancellations
      .map(
        (item) =>
          `${item.visitReasonName}: ${item.cancelledCount} cancelaciones`
      )
      .join(", ");

    const prompt = `Como experto consultor hotelero especializado en ingresos, analiza estos datos financieros y proporciona 3-5 recomendaciones específicas para maximizar ingresos y reducir cancelaciones:

Datos financieros del hotel:
- Ingresos totales del período: $${incomeData.totalIncome.toLocaleString()}
- Porcentaje actual de cancelaciones: ${incomeData.cancelStats.percentage.toFixed(
      1
    )}%
- Porcentaje histórico de cancelaciones: ${
      incomeData.historicalCancellationPercentage?.toFixed(1) || "N/A"
    }%
- Total de cancelaciones: ${incomeData.cancelStats.count}
- Cancelaciones por tipo de visita: ${cancellationReasons}
- Período analizado: ${incomeData.dailyIncomeLength} días

Por favor, proporciona recomendaciones específicas enfocadas en optimizar ingresos, reducir cancelaciones y mejorar la rentabilidad en formato Markdown.

Formato esperado:
## 💰 Recomendación 1: [Título]
**Situación:** Descripción del problema financiero o oportunidad identificada.

**Acción requerida:**
- Acción específica 1
- Acción específica 2

**Impacto esperado:** Estimación del beneficio financiero de implementar esta recomendación.

---

Continúa con el mismo formato para cada recomendación.`;

    return this.getRecommendations({ prompt });
  }

  async getFutureReservationsRecommendations(reservationsData: {
    totalReservations: number;
    averageWeeklyReservations: number;
    maxWeeklyReservations: number;
    minWeeklyReservations: number;
    weeksData: string;
    weeksAnalyzed: number;
  }): Promise<string[]> {
    const prompt = `Como experto consultor hotelero especializado en gestión de reservas, analiza estos datos de reservas futuras y proporciona 3-5 recomendaciones específicas para optimizar la ocupación futura:

Datos de reservas futuras:
- Total de reservas futuras: ${reservationsData.totalReservations}
- Promedio semanal de reservas: ${reservationsData.averageWeeklyReservations.toFixed(
      1
    )}
- Semana con más reservas: ${reservationsData.maxWeeklyReservations}
- Semana con menos reservas: ${reservationsData.minWeeklyReservations}
- Distribución por semanas: ${reservationsData.weeksData}
- Período analizado: ${reservationsData.weeksAnalyzed} semanas

Por favor, proporciona recomendaciones específicas enfocadas en maximizar ocupación futura, balancear la demanda y mejorar estrategias de reservas en formato Markdown.

Formato esperado:
## 📅 Recomendación 1: [Título]
**Situación:** Descripción del patrón de reservas identificado.

**Acción requerida:**
- Acción específica 1
- Acción específica 2

**Impacto esperado:** Estimación del beneficio de implementar esta recomendación.

---

Continúa con el mismo formato para cada recomendación.`;

    return this.getRecommendations({ prompt });
  }

  async getServicesRecommendations(servicesData: {
    topServices: Array<{
      name: string;
      count: number;
      income: number;
      historicalCount: number;
    }>;
    avgConsumptionPerGuest: number;
    totalIncomeFromServices: number;
    daysAnalyzed: number;
  }): Promise<string[]> {
    const topServicesData = servicesData.topServices
      .map(
        (service) =>
          `${service.name}: ${
            service.count
          } usos, $${service.income.toLocaleString()} ingresos (histórico: ${
            service.historicalCount
          } usos)`
      )
      .join("; ");

    const prompt = `Como experto consultor hotelero especializado en servicios y upselling, analiza estos datos de servicios del hotel y proporciona 3-5 recomendaciones específicas para maximizar ingresos por servicios:

Datos de servicios del hotel:
- Servicios más populares: ${topServicesData}
- Consumo promedio por huésped: $${servicesData.avgConsumptionPerGuest.toLocaleString()}
- Ingresos totales por servicios: $${servicesData.totalIncomeFromServices.toLocaleString()}
- Período analizado: ${servicesData.daysAnalyzed} días

Por favor, proporciona recomendaciones específicas enfocadas en aumentar el consumo de servicios, mejorar el upselling y maximizar ingresos adicionales en formato Markdown.

Formato esperado:
## 🛎️ Recomendación 1: [Título]
**Situación:** Descripción del patrón de consumo de servicios identificado.

**Acción requerida:**
- Acción específica 1
- Acción específica 2

**Impacto esperado:** Estimación del beneficio de implementar esta recomendación.

---

Continúa con el mismo formato para cada recomendación.`;

    return this.getRecommendations({ prompt });
  }

  async getRoomsRecommendations(roomsData: {
    totalRooms: number;
    roomStatusToday: {
      occupied: number;
      available: number;
      maintenance: number;
    };
    topRotationRooms: Array<{
      room: string;
      roomType: string;
      stays: number;
    }>;
  }): Promise<string[]> {
    const rotationData = roomsData.topRotationRooms
      .map(
        (room) =>
          `Habitación ${room.room} (${room.roomType}): ${room.stays} estancias`
      )
      .join("; ");

    const prompt = `Como experto consultor hotelero especializado en gestión de habitaciones, analiza estos datos de habitaciones y proporciona 3-5 recomendaciones específicas para optimizar la utilización y mantenimiento:

Datos de habitaciones:
- Total de habitaciones: ${roomsData.totalRooms}
- Estado actual: ${roomsData.roomStatusToday.occupied} ocupadas, ${roomsData.roomStatusToday.available} disponibles, ${roomsData.roomStatusToday.maintenance} en mantenimiento
- Habitaciones con mayor rotación: ${rotationData}

Por favor, proporciona recomendaciones específicas enfocadas en optimizar la rotación de habitaciones, mejorar el mantenimiento y maximizar la disponibilidad en formato Markdown.

Formato esperado:
## 🏨 Recomendación 1: [Título]
**Situación:** Descripción del patrón de uso de habitaciones identificado.

**Acción requerida:**
- Acción específica 1
- Acción específica 2

**Impacto esperado:** Estimación del beneficio de implementar esta recomendación.

---

Continúa con el mismo formato para cada recomendación.`;

    return this.getRecommendations({ prompt });
  }

  async getGuestsRecommendations(guestsData: {
    frequentGuests: Array<{
      name: string;
      stays: number;
    }>;
    longStays: Array<{
      name: string;
      days: number;
    }>;
    cities: Array<{
      city: string;
      count: number;
    }>;
    countries: Array<{
      country: string;
      count: number;
    }>;
  }): Promise<string[]> {
    const frequentGuestsData = guestsData.frequentGuests
      .map((guest) => `${guest.name}: ${guest.stays} estancias`)
      .join("; ");

    const longStaysData = guestsData.longStays
      .map((guest) => `${guest.name}: ${guest.days} días`)
      .join("; ");

    const topCities = guestsData.cities
      .slice(0, 5)
      .map((city) => `${city.city}: ${city.count} huéspedes`)
      .join("; ");

    const topCountries = guestsData.countries
      .slice(0, 5)
      .map((country) => `${country.country}: ${country.count} huéspedes`)
      .join("; ");

    const prompt = `Como experto consultor hotelero especializado en gestión de huéspedes y marketing, analiza estos datos demográficos y de comportamiento de huéspedes para proporcionar 3-5 recomendaciones específicas:

Datos de huéspedes:
- Huéspedes frecuentes: ${frequentGuestsData}
- Estancias más largas: ${longStaysData}
- Principales ciudades de origen: ${topCities}
- Principales países de origen: ${topCountries}

Por favor, proporciona recomendaciones específicas enfocadas en mejorar la experiencia del huésped, implementar programas de fidelización y optimizar estrategias de marketing geográfico en formato Markdown.

Formato esperado:
## 👥 Recomendación 1: [Título]
**Situación:** Descripción del patrón de comportamiento de huéspedes identificado.

**Acción requerida:**
- Acción específica 1
- Acción específica 2

**Impacto esperado:** Estimación del beneficio de implementar esta recomendación.

---

Continúa con el mismo formato para cada recomendación.`;

    return this.getRecommendations({ prompt });
  }
}

// Instancia singleton del servicio
export const aiService = new AIService();
