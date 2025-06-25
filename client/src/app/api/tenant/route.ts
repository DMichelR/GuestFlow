// src/app/api/tenant/route.ts

import { getCurrentUserWithTenant } from "@/lib/user";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentUserData = await getCurrentUserWithTenant();
    const tenantId = currentUserData?.tenantId;
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
