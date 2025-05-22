// src/app/api/rooms/available/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Función para obtener la lista de habitaciones disponibles desde el API
async function fetchAvailableRooms(token: string | null) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  try {
    // Hacemos una solicitud al backend para obtener las habitaciones disponibles
    const response = await fetch(`${API_URL}/Rooms/available`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.error("Error fetching available rooms:", await response.text());
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en la petición al API:", error);
    throw error;
  }
}

export async function GET() {
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

    // Obtener las habitaciones disponibles usando el token
    const availableRooms = await fetchAvailableRooms(token);

    return NextResponse.json(availableRooms);
  } catch (error) {
    console.error("Error al obtener habitaciones disponibles:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener las habitaciones disponibles",
      { status: 500 }
    );
  }
}
