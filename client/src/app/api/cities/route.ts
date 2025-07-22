// src/app/api/cities/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Función para obtener la lista de ciudades desde el API
async function fetchCities(token: string | null, countryId?: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  let url = `${API_URL}/Cities`;
  if (countryId) {
    url += `?countryId=${countryId}`;
  }

  try {
    // Hacemos una solicitud al backend para obtener las ciudades
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.error("Error fetching cities:", await response.text());
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
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
    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const countryId = url.searchParams.get("countryId");

    // Obtener el token desde la sesión
    const session = await auth();
    const token = await session.getToken();

    // Obtener las ciudades usando el token
    const cities = await fetchCities(token, countryId || undefined);

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Error al obtener ciudades:", error);

    // Devolver una respuesta de error adecuada
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener las ciudades",
      { status: 500 }
    );
  }
}
