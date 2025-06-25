// src/app/api/reservation/[id]/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Función para obtener una Reserva específica desde el API
async function fetchReservation(id: string, token: string | null) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  try {
    // Hacemos una solicitud al backend para obtener la Reserva específica
    const response = await fetch(`${API_URL}/Reservations/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.error(`Error fetching reservation ${id}:`, await response.text());
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en la petición al API:", error);
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const { id } = await params;

  if (!id) {
    return new NextResponse("ID de Reserva no proporcionado", {
      status: 400,
    });
  }

  try {
    // Obtener el token desde la sesión
    const session = await auth();
    const token = await session.getToken();

    // Obtener la Reserva usando el token
    const reservation = await fetchReservation(id, token);

    return NextResponse.json(reservation);
  } catch (error) {
    console.error(`Error al obtener la Reserva ${id}:`, error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : `Error desconocido al obtener la Reserva ${id}`,
      { status: 500 }
    );
  }
}
