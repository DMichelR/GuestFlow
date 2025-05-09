// filepath: /home/mcqueen/Desktop/Code/Proyecto de grado/GuestFlow/client/src/utils/userService.ts
import { clerkClient } from "@clerk/nextjs/server";

interface UserCreateData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  tenantId?: string;
  phone?: string;
}

export const createClerkUser = async (userData: UserCreateData) => {
  const client = await clerkClient();

  const user = await client.users.createUser({
    emailAddress: [userData.email],
    firstName: userData.firstName,
    lastName: userData.lastName,
    password: userData.password,
    publicMetadata: {
      role: userData.role,
      tenantId: userData.tenantId || "",
    },
  });

  return user;
};

export const mapRoleToAccessLevel = (role: string): number => {
  switch (role.toLowerCase()) {
    case "admin":
      return 3;
    case "manager":
      return 2;
    case "receptionist":
      return 1;
    case "staff":
    default:
      return 0; // staff/default
  }
};

export const sendUserToAPI = async (
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    accessLevel: number;
  },
  token: string,
  clerkId: string
) => {
  const apiResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ""}/Users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ClerkId": clerkId,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    }
  );

  if (!apiResponse.ok) {
    try {
      const errorData = await apiResponse.json();
      console.error("API error creating user:", errorData);
      throw new Error(JSON.stringify(errorData));
    } catch {
      const errorText = await apiResponse.text();
      console.error(
        `API error (non-JSON): ${apiResponse.status} ${apiResponse.statusText}`,
        errorText || "No response body"
      );
      throw new Error(
        `API error: ${apiResponse.status} ${apiResponse.statusText}`
      );
    }
  }

  return await apiResponse.json();
};
