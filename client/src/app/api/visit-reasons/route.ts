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
    const response = await fetch(`${API_URL}/VisitReason`, {
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

export async function POST(request: Request) {
  // Verificar que el usuario sea admin o manager
  if (!(await checkRole("admin")) && !(await checkRole("manager"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await getCurrentUserWithTenant();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await request.json();

    if (!data.name || data.name.trim() === "") {
      return new NextResponse("Name is required", { status: 400 });
    }

    const session = await auth();
    const token = await session.getToken();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/VisitReason`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ name: data.name }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al crear motivo de visita:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al crear el motivo de visita",
      { status: 500 }
    );
  }
}
