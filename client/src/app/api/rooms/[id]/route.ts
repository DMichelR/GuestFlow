// src/app/api/rooms/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar que el usuario sea admin, manager o staff
  if (
    !(await checkRole("admin")) &&
    !(await checkRole("manager")) &&
    !(await checkRole("staff"))
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const session = await auth();
    const token = await session.getToken();

    if (!token) {
      return new NextResponse("No authentication token", { status: 401 });
    }

    // Enviar la solicitud a la API backend para obtener la habitación
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/Rooms/number/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Error fetching room ${id}: ${response.status} - ${errorText}`
      );
      return new NextResponse(
        `Error from API: ${response.status} ${errorText}`,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error in room/${id} API route:`, error);
    return NextResponse.json(
      { error: `Failed to fetch room data for ID: ${id}` },
      { status: 500 }
    );
  }
}
