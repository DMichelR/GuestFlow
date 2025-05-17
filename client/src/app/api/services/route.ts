// src/app/api/services/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";

export async function GET() {
  // Verificar que el usuario sea manager o superior
  if (!(await checkRole("manager"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const session = await auth();
    const token = await session.getToken();

    if (!token) {
      return new NextResponse("No authentication token", { status: 401 });
    }

    // Enviar la solicitud a la API backend para obtener los servicios
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/Services`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error fetching services:", errorText);
      return new NextResponse(
        `Error al obtener servicios: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    // Devolver los servicios
    const services = await response.json();
    return NextResponse.json(services);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function POST(request: Request) {
  // Verificar que el usuario sea manager o superior
  if (!(await checkRole("manager"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const session = await auth();
    const token = await session.getToken();

    if (!token) {
      return new NextResponse("No authentication token", { status: 401 });
    }

    const data = await request.json();

    // Enviar la solicitud a la API backend para crear un nuevo servicio
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/Services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error creating service:", errorText);
      return new NextResponse(
        `Error al crear servicio: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    // Devolver el nuevo servicio creado
    const service = await response.json();
    return NextResponse.json(service);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
