// src/app/api/reservation-update/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Definir la interfaz para el tipo de datos de actualización
interface UpdateReservationData {
  id: string;
  holderId?: string; // Agregamos holderId
  visitReasonId?: string;
  arrivalDate?: string | Date;
  departureDate?: string | Date;
  pax?: number;
  finalPrice?: number | null;
  notes?: string | null;
  state?: number;
  companyId?: string | null;
  roomIds?: string[];
  guestIds?: string[];
}

// Función para actualizar una Reserva en el API
async function updateReservationInBackend(
  data: UpdateReservationData,
  token: string | null
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const reservationId = data.id;

  // Crear una copia del objeto para enviar al API (sin incluir el ID)
  const dataToSend = {
    holderId: data.holderId, // Agregamos holderId
    visitReasonId: data.visitReasonId,
    arrivalDate: data.arrivalDate,
    departureDate: data.departureDate,
    pax: data.pax,
    finalPrice: data.finalPrice,
    notes: data.notes,
    state: data.state,
    companyId: data.companyId,
    roomIds: data.roomIds,
    guestIds: data.guestIds,
  };

  // Convertir los IDs de habitaciones y huéspedes a formato GUID para el backend
  if (dataToSend.roomIds && Array.isArray(dataToSend.roomIds)) {
    dataToSend.roomIds = dataToSend.roomIds
      .map((id: string) => {
        // Si ya es un GUID válido, lo dejamos como está
        if (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id
          )
        ) {
          return id;
        }

        // Si no tiene guiones, intentamos formatear como GUID
        if (/^[0-9a-f]{32}$/i.test(id)) {
          return `${id.substring(0, 8)}-${id.substring(8, 12)}-${id.substring(
            12,
            16
          )}-${id.substring(16, 20)}-${id.substring(20)}`;
        }

        return id;
      })
      .filter((id: string) => id !== null && id !== undefined);
  }

  if (dataToSend.guestIds && Array.isArray(dataToSend.guestIds)) {
    dataToSend.guestIds = dataToSend.guestIds
      .map((id: string) => {
        // Si ya es un GUID válido, lo dejamos como está
        if (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id
          )
        ) {
          return id;
        }

        // Si no tiene guiones, intentamos formatear como GUID
        if (/^[0-9a-f]{32}$/i.test(id)) {
          return `${id.substring(0, 8)}-${id.substring(8, 12)}-${id.substring(
            12,
            16
          )}-${id.substring(16, 20)}-${id.substring(20)}`;
        }

        return id;
      })
      .filter((id: string) => id !== null && id !== undefined);
  }

  // Envolver los datos en un objeto dto como espera el backend
  const wrappedData = {
    visitReasonId: dataToSend.visitReasonId,
    holderId: dataToSend.holderId,
    arrivalDate: dataToSend.arrivalDate,
    departureDate: dataToSend.departureDate,
    pax: dataToSend.pax,
    finalPrice: dataToSend.finalPrice,
    notes: dataToSend.notes,
    state: dataToSend.state,
    companyId: dataToSend.companyId,
    roomIds: dataToSend.roomIds,
    guestIds: dataToSend.guestIds,
  };

  try {
    // Hacemos una solicitud al backend para actualizar la Reserva
    const response = await fetch(`${API_URL}/Reservations/${reservationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(wrappedData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error updating reservation:", errorText);
      throw new Error(
        `Error ${response.status}: ${errorText || response.statusText}`
      );
    }

    console.log("Datos a enviar al backend:", wrappedData);
    return await response.json();
  } catch (error) {
    console.error("Error en la petición al API:", error);
    throw error;
  }
}

export async function PUT(request: Request) {
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
    const data = await request.json();

    // Validaciones básicas
    if (!data.id) {
      return new NextResponse("El ID de la Reserva es requerido", {
        status: 400,
      });
    }

    if (data.visitReasonId === "") {
      return new NextResponse("El motivo de visita es requerido", {
        status: 400,
      });
    }

    if (data.arrivalDate && data.departureDate) {
      const arrivalDate = new Date(data.arrivalDate);
      const departureDate = new Date(data.departureDate);

      // Comprobar que la fecha de salida es posterior a la fecha de llegada
      if (departureDate <= arrivalDate) {
        return new NextResponse(
          "La fecha de salida debe ser posterior a la fecha de llegada",
          {
            status: 400,
          }
        );
      }
    }

    if (data.pax !== undefined && data.pax <= 0) {
      return new NextResponse("El número de huéspedes debe ser mayor a 0", {
        status: 400,
      });
    }

    if (
      data.roomIds !== undefined &&
      (!Array.isArray(data.roomIds) || data.roomIds.length === 0)
    ) {
      return new NextResponse("Debe seleccionar al menos una habitación", {
        status: 400,
      });
    }

    // Actualizar la Reserva usando el token
    const reservation = await updateReservationInBackend(data, token);

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error al actualizar la Reserva:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al actualizar la Reserva",
      { status: 500 }
    );
  }
}
