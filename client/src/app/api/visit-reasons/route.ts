// src/app/api/visit-reasons/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Función para obtener la lista de motivos de visita desde el API
async function fetchVisitReasons(token: string | null) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  try {
    // Hacemos una solicitud al backend para obtener los motivos de visita
    const response = await fetch(`${API_URL}/VisitReasons`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.error("Error fetching visit reasons:", await response.text());
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

    // Obtener los motivos de visita usando el token
    const visitReasons = await fetchVisitReasons(token);

    return NextResponse.json(visitReasons);
  } catch (error) {
    console.error("Error al obtener motivos de visita:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener los motivos de visita",
      { status: 500 }
    );
  }
}
