// src/app/api/rooms/available/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Función para obtener la lista de habitaciones disponibles desde el API
async function fetchAvailableRooms(
  token: string | null,
  startDate?: string,
  endDate?: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // Construir la URL con los parámetros de consulta si están presentes
  let url = `${API_URL}/Rooms/available`;

  if (startDate && endDate) {
    // Format should match what the backend API expects (typically ISO format)
    url += `?startDate=${encodeURIComponent(
      startDate
    )}&endDate=${encodeURIComponent(endDate)}`;
    console.log(`Requesting available rooms from ${startDate} to ${endDate}`);
  } else {
    console.log("Warning: No date range provided for available rooms");
  }

  try {
    // Hacemos una solicitud al backend para obtener las habitaciones disponibles
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.error("Error fetching available rooms:", await response.text());
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Available rooms data:", data);
    return data;
  } catch (error) {
    console.error("Error en la petición al API:", error);
    throw error;
  }
}

export async function GET(request: Request) {
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
    // Extraer los parámetros de consulta de la URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Obtener el token desde la sesión
    const session = await auth();
    const token = await session.getToken();

    // Obtener las habitaciones disponibles usando el token y las fechas
    const availableRooms = await fetchAvailableRooms(
      token,
      startDate || undefined,
      endDate || undefined
    );

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
