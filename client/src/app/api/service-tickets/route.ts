// src/app/api/service-tickets/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";
import { getCurrentUserWithTenant } from "@/lib/user";

export async function POST(request: Request) {
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
    const user = await getCurrentUserWithTenant();

    if (!token) {
      return new NextResponse("No authentication token", { status: 401 });
    }

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const data = await request.json();

    // Send the request to the backend API to create a service ticket
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

    const userDbResponse = await fetch(
      `${API_URL}/Users/byEmail/${user.email}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const userDb = await userDbResponse.json();
    console.log("User from DB:", userDb);
    // Add the userId from the current authenticated user
    // Send direct properties at top level, not wrapped in dto
    const requestData = {
      stayId: data.stayId,
      serviceId: data.serviceId,
      userId: userDb.id,
      price: data.price,
      notes: data.notes,
    };

    console.log("Request data:", requestData);
    const response = await fetch(`${API_URL}/Tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error creating service ticket:", errorText);
      return new NextResponse(
        `Error creating service ticket: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    // Return the created service ticket
    const serviceTicket = await response.json();
    return NextResponse.json(serviceTicket);
  } catch (error) {
    console.error("Error processing request:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
