import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET - Fetch a specific guest by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const token = await session.getToken();

    // Check if the user is authenticated
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: guestId } = await params;

    // Make API request to the backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/Guests/${guestId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch guest: ${errorData}` },
        { status: response.status }
      );
    }

    const guest = await response.json();
    return NextResponse.json(guest);
  } catch (error) {
    console.error("Error fetching guest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a guest by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const token = await session.getToken();

    // Check if the user is authenticated
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: guestId } = await params;
    const data = await request.json();

    console.log("Updating guest with data:", guestId);
    console.log("Updating guest with data:", data);
    // Make API request to the backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/Guests/${guestId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `Failed to update guest: ${errorData}` },
        { status: response.status }
      );
    }

    const updatedGuest = await response.json();
    return NextResponse.json(updatedGuest);
  } catch (error) {
    console.error("Error updating guest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a guest by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const token = await session.getToken();

    // Check if the user is authenticated
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: guestId } = await params;

    // Make API request to the backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/Guests/${guestId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `Failed to delete guest: ${errorData}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting guest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
