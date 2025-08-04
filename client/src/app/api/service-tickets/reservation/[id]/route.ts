// src/app/api/service-tickets/reservation/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify user has at least staff role
  if (
    !(await checkRole("admin")) &&
    !(await checkRole("manager")) &&
    !(await checkRole("receptionist")) &&
    !(await checkRole("staff"))
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const session = await auth();
    const token = await session.getToken();

    if (!token) {
      return new NextResponse("No authentication token", { status: 401 });
    }

    const { id } = await params;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

    // Call the backend API to get service tickets for the reservation/stay
    const response = await fetch(`${API_URL}/Tickets/byStay/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error fetching service tickets:", errorText);
      return new NextResponse(
        `Error fetching service tickets: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    // Return the service tickets
    const serviceTickets = await response.json();
    return NextResponse.json(serviceTickets);
  } catch (error) {
    console.error("Error processing request:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
