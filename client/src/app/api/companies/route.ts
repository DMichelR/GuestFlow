// src/app/api/companies/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Función para obtener la lista de empresas desde el API
async function fetchCompanies(token: string | null) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  try {
    // Hacemos una solicitud al backend para obtener las empresas
    const response = await fetch(`${API_URL}/Companies`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.error("Error fetching companies:", await response.text());
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

    // Obtener las empresas
    const companies = await fetchCompanies(token);

    // Devolver la respuesta JSON con las empresas
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error en GET /api/companies:", error);
    return new NextResponse(
      `Error obteniendo empresas: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
      { status: 500 }
    );
  }
}
