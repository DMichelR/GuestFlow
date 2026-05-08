// src/app/api/tenant/route.ts

import { getCurrentUserWithTenant } from "@/lib/user";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentUserData = await getCurrentUserWithTenant();
    const tenantId = currentUserData?.tenantId;
    const userRole = currentUserData?.role;

    // TenantId especial para el administrador del sistema
    const SYSTEM_ADMIN_TENANT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    // Si el usuario es admin del sistema (con o sin tenantId especial)
    if (
      userRole === "admin" &&
      (!tenantId || tenantId === SYSTEM_ADMIN_TENANT_ID)
    ) {
      return NextResponse.json({
        id: SYSTEM_ADMIN_TENANT_ID,
        name: "Administrador del Sistema",
        email: currentUserData?.email || "",
        role: "admin",
        isSystemAdmin: true,
      });
    }

    if (!tenantId) {
      console.log("No se encontró el ID de inquilino del usuario actual.");
      return NextResponse.json(
        { error: "Tenant ID not found" },
        { status: 404 }
      );
    }

    const session = await auth();
    const token = await session.getToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/Tenants/${tenantId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tenant data: ${response.status}`);
    }

    const tenant = await response.json();
    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant data" },
      { status: 500 }
    );
  }
}
