// src/app/api/users/managers/route.ts
import { NextResponse } from "next/server";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  // Verificar que el usuario sea admin, manager o staff
  if (
    !(await checkRole("admin")) &&
    !(await checkRole("manager")) &&
    !(await checkRole("staff"))
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Obtener el token desde la sesión
    const session = await auth();
    const token = await session.getToken();

    if (!token) {
      return new NextResponse("No authentication token", { status: 401 });
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

    // Obtener todos los usuarios del sistema con nivel de acceso de manager
    const response = await fetch(`${API_URL}/Users/admin`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return new NextResponse(`Error fetching users: ${response.status}`, {
        status: response.status,
      });
    }

    const users = await response.json();

    // Filtrar solo los usuarios con accessLevel = 2 (Manager)
    const managers = users.filter((user) => user.accessLevel === 2);
    console.log("Managers fetched:", managers);
    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener los managers",
      { status: 500 }
    );
  }
}
