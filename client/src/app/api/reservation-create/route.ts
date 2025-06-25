// src/app/api/reservation-create/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

interface ReservationData {
  visitReasonId: string;
  holderId: string;
  arrivalDate: string;
  departureDate: string;
  pax: number;
  finalPrice?: number;
  notes?: string;
  state?: number;
  companyId?: string;
  roomIds: string[];
  guestIds: string[];
  [key: string]: unknown;
}

// Función para crear una Reserva en el API
async function createReservationInBackend(
  data: ReservationData,
  token: string | null
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // Asegurar que las fechas estén en formato ISO para .NET DateTime
  if (data.arrivalDate && typeof data.arrivalDate === "string") {
    const date = new Date(data.arrivalDate);
    data.arrivalDate = date.toISOString();
  }

  if (data.departureDate && typeof data.departureDate === "string") {
    const date = new Date(data.departureDate);
    data.departureDate = date.toISOString();
  }

  try {
    // Hacemos una solicitud al backend para crear la Reserva
    const response = await fetch(`${API_URL}/Reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error creating reservation:", errorText);
      throw new Error(
        `Error ${response.status}: ${errorText || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error en la petición al API:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  // Verificar que el usuario sea admin o manager o staff
  if (
    !(await checkRole("admin")) &&
    !(await checkRole("manager")) &&
    !(await checkRole("staff"))
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await getCurrentUserWithTenant();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Obtener el token desde la sesión
    const session = await auth();
    const token = await session.getToken();

    // Obtener los datos del cuerpo de la solicitud
    const data: ReservationData = await request.json();

    // Validaciones básicas
    if (!data.visitReasonId) {
      return new NextResponse("El motivo de visita es requerido", {
        status: 400,
      });
    }
    if (!data.holderId) {
      return new NextResponse("El titular de la Reserva es requerido", {
        status: 400,
      });
    }
    if (!data.arrivalDate) {
      return new NextResponse("La fecha de llegada es requerida", {
        status: 400,
      });
    }
    if (!data.departureDate) {
      return new NextResponse("La fecha de salida es requerida", {
        status: 400,
      });
    }
    if (data.pax <= 0) {
      return new NextResponse("El número de huéspedes debe ser mayor a 0", {
        status: 400,
      });
    }
    if (!Array.isArray(data.roomIds) || data.roomIds.length === 0) {
      return new NextResponse("Debe seleccionar al menos una habitación", {
        status: 400,
      });
    }

    // Crear la Reserva usando el token
    const reservation = await createReservationInBackend(data, token);

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error al crear la Reserva:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al crear la Reserva",
      { status: 500 }
    );
  }
}
