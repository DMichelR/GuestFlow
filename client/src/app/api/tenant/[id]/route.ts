// src/app/api/tenant/[id]/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";

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

  try {
    const { id } = await params;

    if (!id) {
      return new NextResponse("Tenant ID is required", { status: 400 });
    }

    // Obtener el token desde la sesión
    const session = await auth();
    const token = await session.getToken();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

    // Obtener los datos del tenant
    const tenantResponse = await fetch(`${API_URL}/Tenants/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!tenantResponse.ok) {
      return new NextResponse(
        `Error fetching tenant: ${tenantResponse.status}`,
        {
          status: tenantResponse.status,
        }
      );
    }

    const tenant = await tenantResponse.json();

    // Obtener los managers del tenant
    const managersResponse = await fetch(
      `${API_URL}/Users/Managers?tenantId=${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );

    let managers = [];
    if (managersResponse.ok) {
      managers = await managersResponse.json();
    } else {
      console.error(`Error fetching managers: ${managersResponse.status}`);
    }

    // Devolver una respuesta con el tenant y sus managers
    return NextResponse.json({
      ...tenant,
      managers,
    });
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener los detalles del hotel",
      { status: 500 }
    );
  }
}
