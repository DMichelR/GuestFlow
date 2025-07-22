// src/app/api/user/[id]/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { id } = params;

    if (!id) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Obtener el token desde la sesión
    const session = await auth();
    const token = await session.getToken();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

    // Primero intentamos obtener los datos del usuario desde la API usando el ID
    const userResponse = await fetch(`${API_URL}/Users/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!userResponse.ok) {
      // Si no encontramos al usuario por ID, intentamos buscarlo por email
      // Asumimos que el ID es el email del usuario en Clerk
      console.log("Usuario no encontrado por ID, intentando por email:", id);

      // Buscar el usuario por email
      const userByEmailResponse = await fetch(
        `${API_URL}/Users/byEmail/${encodeURIComponent(id)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!userByEmailResponse.ok) {
        return new NextResponse(
          `Error fetching user: ${userByEmailResponse.status}`,
          {
            status: userByEmailResponse.status,
          }
        );
      }

      const userData = await userByEmailResponse.json();
      return NextResponse.json(userData);
    }

    const userData = await userResponse.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user details:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener los detalles del usuario",
      { status: 500 }
    );
  }
}
