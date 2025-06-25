// src/app/api/guest-create/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

interface GuestData {
  name: string;
  lastName: string;
  cid: string;
  birthday: string;
  email: string;
  phone: string;
  address: string;
  professionId?: string | null;
  cityId: string;
  countryId: string;
  [key: string]: unknown;
}

// Función para crear un huésped en el API
async function createGuestInBackend(data: GuestData, token: string | null) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // Asegurar que la fecha de cumpleaños se envíe en formato ISO
  if (data.birthday && typeof data.birthday === "string") {
    // Transformar fecha al formato esperado por la API (.NET DateTime)
    const date = new Date(data.birthday);
    data.birthday = date.toISOString();
  }

  try {
    // Hacemos una solicitud al backend para crear el huésped
    const response = await fetch(`${API_URL}/Guests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Error creating guest:", await response.text());
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en la petición al API:", error);
    throw error;
  }
}

export async function POST(request: Request) {
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
    // Obtener los datos del request
    const guestData: GuestData = await request.json();

    // Obtener el token desde la sesión
    const session = await auth();
    const token = await session.getToken();

    // Crear el huésped usando el token
    const guest = await createGuestInBackend(guestData, token);

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Error al crear huésped:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al crear el huésped",
      { status: 500 }
    );
  }
}
