// src/app/api/visit-reasons/[id]/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar que el usuario sea admin o manager
  if (!(await checkRole("admin")) && !(await checkRole("manager"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await getCurrentUserWithTenant();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  try {
    const data = await request.json();

    if (!data.name || data.name.trim() === "") {
      return new NextResponse("Name is required", { status: 400 });
    }

    const session = await auth();
    const token = await session.getToken();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/VisitReason/${id}`, {
      method: "PUT",
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
    console.error(`Error al actualizar motivo de visita ${id}:`, error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al actualizar el motivo de visita",
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar que el usuario sea admin o manager
  if (!(await checkRole("admin")) && !(await checkRole("manager"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await getCurrentUserWithTenant();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  try {
    const session = await auth();
    const token = await session.getToken();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/VisitReason/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error al eliminar motivo de visita ${id}:`, error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al eliminar el motivo de visita",
      { status: 500 }
    );
  }
}

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

  const user = await getCurrentUserWithTenant();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  try {
    const session = await auth();
    const token = await session.getToken();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${API_URL}/VisitReason/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error al obtener motivo de visita ${id}:`, error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener el motivo de visita",
      { status: 500 }
    );
  }
}
