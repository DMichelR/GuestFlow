// src/app/api/professions/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

// Interfaz para la petición de creación de profesión
interface CreateProfessionRequest {
  name: string;
}

// Función para obtener la lista de profesiones desde el API
async function fetchProfessions(token: string | null) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  try {
    // Hacemos una solicitud al backend para obtener las profesiones
    const response = await fetch(`${API_URL}/Professions`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.error("Error fetching professions:", await response.text());
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en la petición al API:", error);
    throw error;
  }
}

// Función para crear una nueva profesión en el API
async function createProfession(
  token: string | null,
  data: CreateProfessionRequest
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  try {
    // Hacemos una solicitud al backend para crear la profesión
    const response = await fetch(`${API_URL}/Professions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error creating profession:", errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en la petición al API para crear profesión:", error);
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

    // Obtener las profesiones usando el token
    const professions = await fetchProfessions(token);

    return NextResponse.json(professions);
  } catch (error) {
    console.error("Error al obtener profesiones:", error);

    // Devolver una respuesta de error adecuada
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener las profesiones",
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Verificar que el usuario tenga permisos para crear profesiones (al menos recepcionista)
  if (
    !(await checkRole("admin")) &&
    !(await checkRole("manager")) &&
    !(await checkRole("receptionist"))
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await getCurrentUserWithTenant();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Obtener los datos de la solicitud
    const data = (await request.json()) as CreateProfessionRequest;

    // Validar que el nombre no esté vacío
    if (!data.name || data.name.trim() === "") {
      return new NextResponse("El nombre de la profesión es obligatorio", {
        status: 400,
      });
    }

    // Obtener el token desde la sesión
    const session = await auth();
    const token = await session.getToken();

    // Crear la profesión usando el token
    const newProfession = await createProfession(token, data);

    return NextResponse.json(newProfession, { status: 201 });
  } catch (error) {
    console.error("Error al crear profesión:", error);

    // Devolver una respuesta de error adecuada
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al crear la profesión",
      { status: 500 }
    );
  }
}
