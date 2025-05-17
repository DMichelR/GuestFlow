// src/app/api/room-types/route.ts
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

    // Enviar la solicitud a la API backend para obtener los tipos de habitaciones
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/RoomTypes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error fetching room types:", errorText);
      return new NextResponse(
        `Error al obtener tipos de habitaciones: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    // Devolver los tipos de habitaciones
    const roomTypes = await response.json();
    return NextResponse.json(roomTypes);
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

    // Enviar la solicitud a la API backend para crear un nuevo tipo de habitación
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/RoomTypes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error creating room type:", errorText);
      return new NextResponse(
        `Error al crear tipo de habitación: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    // Devolver el nuevo tipo de habitación creado
    const roomType = await response.json();
    return NextResponse.json(roomType);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
