// src/app/api/guests/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Función para obtener la lista de huéspedes desde el API
async function fetchGuests(token: string | null) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  try {
    // Hacemos una solicitud al backend para obtener los huéspedes
    const response = await fetch(`${API_URL}/Guests`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.error("Error fetching guests:", await response.text());
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

    // Obtener los huéspedes usando el token
    const guests = await fetchGuests(token);

    return NextResponse.json(guests);
  } catch (error) {
    console.error("Error al obtener huéspedes:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener los huéspedes",
      { status: 500 }
    );
  }
}
