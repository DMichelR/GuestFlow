// src/app/api/rooms/route.ts
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

    // Enviar la solicitud a la API backend para obtener las habitaciones
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/Rooms`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching rooms: ${response.status} - ${errorText}`);
      return new NextResponse(
        `Error from API: ${response.status} ${errorText}`,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in rooms API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms data" },
      { status: 500 }
    );
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

    // Enviar la solicitud a la API backend para crear una nueva habitación
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/Rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error creating room:", errorText);
      return new NextResponse(
        `Error al crear habitación: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    // Devolver la nueva habitación creada
    const room = await response.json();
    return NextResponse.json(room);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
