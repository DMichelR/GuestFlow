// src/app/api/tenant-create/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";

export async function POST(request: Request) {
  // Verificar que el usuario sea admin
  if (!(await checkRole("admin"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const session = await auth();
    const token = await session.getToken();
    
    if (!token) {
      return new NextResponse("No authentication token", { status: 401 });
    }

    // Obtener los datos del cuerpo de la solicitud
    const tenantData = await request.json();
    
    // Validar que se proporcione un nombre
    if (!tenantData.name || tenantData.name.trim() === '') {
      return new NextResponse("El nombre del hotel es requerido", { 
        status: 400 
      });
    }

    // Enviar la solicitud a la API backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/Tenants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name: tenantData.name }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error creating tenant:", errorText);
      return new NextResponse(
        `Error al crear el hotel: ${response.status} ${response.statusText}`, 
        { status: response.status }
      );
    }

    // Devolver los datos del tenant creado
    const createdTenant = await response.json();
    return NextResponse.json(createdTenant);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
