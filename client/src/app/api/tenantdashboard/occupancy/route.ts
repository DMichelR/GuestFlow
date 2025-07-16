// src/app/api/tenantdashboard/occupancy/route.ts
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";

export async function GET(request: NextRequest) {
  // Verificar que el usuario sea staff o superior
  if (!(await checkRole("staff"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const session = await auth();
    const token = await session.getToken();

    if (!token) {
      return new NextResponse("No authentication token", { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!fromDate || !toDate) {
      return new NextResponse("fromDate and toDate are required", {
        status: 400,
      });
    }

    // Enviar la solicitud a la API backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const queryParams = new URLSearchParams({
      fromDate,
      toDate,
    });

    const response = await fetch(
      `${API_URL}/TenantDashboard/occupancy?${queryParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend API error:", errorText);
      return new NextResponse(`Backend error: ${response.status}`, {
        status: response.status,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching occupancy data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
