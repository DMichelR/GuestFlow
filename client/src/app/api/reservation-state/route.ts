// src/app/api/reservation-state/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Función para cambiar el estado de una Reserva en el API
async function changeReservationState(
  id: string,
  state: string,
  token: string | null
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  try {
    // Hacemos una solicitud al backend para cambiar el estado de la Reserva
    const response = await fetch(
      `${API_URL}/Reservations/${id}/state/${state}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error changing reservation state:", errorText);
      throw new Error(
        `Error ${response.status}: ${errorText || response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error en la petición al API:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  // Verificar que el usuario sea admin, manager o staff
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

    // Validar los datos recibidos
    if (!data.id) {
      return new NextResponse("El ID de la Reserva es requerido", {
        status: 400,
      });
    }

    if (!data.state) {
      return new NextResponse("El estado de la Reserva es requerido", {
        status: 400,
      });
    }

    // Cambiar el estado de la Reserva usando el token
    const success = await changeReservationState(data.id, data.state, token);

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Error al cambiar estado de la Reserva:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al cambiar el estado de la Reserva",
      { status: 500 }
    );
  }
}
