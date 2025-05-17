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

// Método específico para enviar datos de un manager a la API
export const sendManagerToAPI = async (
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    accessLevel: number;
    tenantId: string; // Requerido para managers
  },
  token: string,
  clerkId: string
) => {
  console.log("Enviando manager a la API:", {
    ...userData,
    tenantId: userData.tenantId, // Log específico del tenantId
    tokenLength: token?.length ?? 0,
  });

  // Validar que tenantId sea un GUID válido
  if (!userData.tenantId) {
    console.error("Error: tenantId es nulo o vacío");
    throw new Error("El ID del hotel es requerido para crear un manager");
  }

  // Verificar formato básico de GUID (simplificado)
  const guidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(userData.tenantId)) {
    console.error(
      "Error: tenantId no tiene formato de GUID válido:",
      userData.tenantId
    );
    // No lanzamos error para permitir que el backend valide
  }

  // Crear el payload para la API
  const payload = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phone: userData.phone,
    accessLevel: userData.accessLevel,
    tenantId: userData.tenantId, // GUID del tenant seleccionado
  };

  console.log("API payload para manager:", JSON.stringify(payload));

  // Por ahora usamos el mismo endpoint, pero en el futuro se cambiará a /Users/Managers
  const apiResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ""}/Users/Managers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ClerkId": clerkId,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!apiResponse.ok) {
    try {
      const errorData = await apiResponse.json();
      console.error("API error creando manager:", errorData);
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
