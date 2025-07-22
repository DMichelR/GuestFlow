// src/app/admin/_actions.ts
"use server";

import { checkRole } from "@/utils/roles";
import {
  createClerkUser,
  mapRoleToAccessLevel,
  sendUserToAPI,
  sendManagerToAPI,
} from "@/utils/userService";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createUser(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkRole("manager"))) {
    throw new Error("Not Authorized");
  }

  try {
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = (formData.get("phone") as string) || "11111111";
    let role = formData.get("role") as string;
    const tenantId = (formData.get("tenantId") as string) || "";
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;

    // Verificar si el usuario actual es un manager
    const { sessionClaims } = await auth();
    const currentUserRole = sessionClaims?.metadata.role as string;

    // Si el usuario es manager y está intentando crear un usuario con rol manager, cambiar a receptionist
    if (currentUserRole === "manager" && role === "manager") {
      console.warn(
        "Un manager está intentando crear un usuario con rol manager. Cambiando a receptionist."
      );
      role = "receptionist";
    }

    // Nuevos campos opcionales
    const address = (formData.get("address") as string) || null;
    const governmentId = (formData.get("governmentId") as string) || null;
    const emergencyContactName =
      (formData.get("emergencyContactName") as string) || null;
    const emergencyContactPhone =
      (formData.get("emergencyContactPhone") as string) || null;

    // Campos de fecha
    const birthDate = (formData.get("birthDate") as string) || null;
    // Usar fecha actual para hireDate si no se proporciona
    const hireDate =
      (formData.get("hireDate") as string) ||
      new Date().toISOString().split("T")[0];
    const documentExpiry = (formData.get("documentExpiry") as string) || null;

    const userClerk = await createClerkUser({
      email,
      firstName,
      lastName,
      password,
      role,
      tenantId,
    });

    const accessLevel = mapRoleToAccessLevel(role);

    try {
      // Convertir fechas a formato ISO si están presentes
      const formattedBirthDate = birthDate
        ? new Date(birthDate).toISOString()
        : null;
      const formattedHireDate = hireDate
        ? new Date(hireDate).toISOString()
        : null;
      const formattedDocumentExpiry = documentExpiry
        ? new Date(documentExpiry).toISOString()
        : null;

      await sendUserToAPI(
        {
          firstName,
          lastName,
          email,
          phone,
          accessLevel,
          address,
          governmentId,
          emergencyContactName,
          emergencyContactPhone,
          birthDate: formattedBirthDate,
          hireDate: formattedHireDate,
          documentExpiry: formattedDocumentExpiry,
        },
        token,
        userClerk.id
      );
    } catch (apiError) {
      console.error("Failed to send user data to API:", apiError);
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    console.error("Error creating user:", err);

    if (err && typeof err === "object" && "status" in err && "errors" in err) {
      const errorObj = err as {
        status: number;
        errors: Array<{ longMessage?: string; message?: string }>;
      };

      if (errorObj.status === 422 && Array.isArray(errorObj.errors)) {
        const errorMessages = errorObj.errors
          .map((e) => e.longMessage || e.message || "")
          .filter((msg) => msg)
          .join(". ");

        return {
          success: false,
          error: errorMessages,
        };
      }
    }

    return {
      success: false,
      error: "Error creating user. Please try again.",
    };
  }
}

// Función específica para crear managers
export async function createManager(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkRole("manager"))) {
    throw new Error("Not Authorized");
  }

  try {
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = (formData.get("phone") as string) || "11111111";
    const tenantId = (formData.get("tenantId") as string) || "";
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;

    // Campos opcionales
    const address = (formData.get("address") as string) || null;
    const governmentId = (formData.get("governmentId") as string) || null;
    const emergencyContactName =
      (formData.get("emergencyContactName") as string) || null;
    const emergencyContactPhone =
      (formData.get("emergencyContactPhone") as string) || null;

    // Campos de fecha
    const birthDate = (formData.get("birthDate") as string) || null;
    // Usar fecha actual para hireDate si no se proporciona
    const hireDate =
      (formData.get("hireDate") as string) ||
      new Date().toISOString().split("T")[0];
    const documentExpiry = (formData.get("documentExpiry") as string) || null;

    // Validar que se proporcione un tenantId para los managers
    if (!tenantId) {
      return {
        success: false,
        error: "Se requiere seleccionar un hotel para crear un manager",
      };
    }

    const userClerk = await createClerkUser({
      email,
      firstName,
      lastName,
      password,
      role: "manager", // Siempre "manager" para esta función
      tenantId,
    });

    const accessLevel = mapRoleToAccessLevel("manager");

    try {
      // Convertir fechas a formato ISO si están presentes
      const formattedBirthDate = birthDate
        ? new Date(birthDate).toISOString()
        : null;
      const formattedHireDate = hireDate
        ? new Date(hireDate).toISOString()
        : null;
      const formattedDocumentExpiry = documentExpiry
        ? new Date(documentExpiry).toISOString()
        : null;

      // Usar el método específico para managers
      await sendManagerToAPI(
        {
          firstName,
          lastName,
          email,
          phone,
          accessLevel,
          tenantId,
          address,
          governmentId,
          emergencyContactName,
          emergencyContactPhone,
          birthDate: formattedBirthDate,
          hireDate: formattedHireDate,
          documentExpiry: formattedDocumentExpiry,
        },
        token,
        userClerk.id
      );
    } catch (apiError) {
      console.error("Failed to send manager data to API:", apiError);
      throw apiError;
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    console.error("Error creating manager:", err);

    // Manejo de errores API
    if (err instanceof Error && err.message.includes("API error")) {
      return {
        success: false,
        error: `Error guardando manager en la API: ${err.message}`,
      };
    }

    // Manejo de errores Clerk
    if (err && typeof err === "object" && "status" in err && "errors" in err) {
      const errorObj = err as {
        status: number;
        errors: Array<{ longMessage?: string; message?: string }>;
      };

      if (errorObj.status === 422 && Array.isArray(errorObj.errors)) {
        const errorMessages = errorObj.errors
          .map((e) => e.longMessage || e.message || "")
          .filter((msg) => msg)
          .join(". ");

        return {
          success: false,
          error: errorMessages,
        };
      }
    }

    return {
      success: false,
      error: "Error creating manager. Please try again.",
    };
  }
}

export async function updateUser(formData: FormData): Promise<void> {
  const client = await clerkClient();

  try {
    const userId = formData.get("id") as string | null;
    if (!userId) {
      throw new Error("User ID is required but was not provided.");
    }
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;

    // Campos adicionales
    const phone = formData.get("phone") as string | null;
    const address = formData.get("address") as string | null;
    const governmentId = formData.get("governmentId") as string | null;
    const emergencyContactName = formData.get("emergencyContactName") as
      | string
      | null;
    const emergencyContactPhone = formData.get("emergencyContactPhone") as
      | string
      | null;

    // Handle date fields if present
    const birthDate = formData.get("birthDate") as string | null;
    // Usar fecha actual para hireDate si no se proporciona
    const hireDate =
      (formData.get("hireDate") as string) ||
      new Date().toISOString().split("T")[0];
    const documentExpiry = formData.get("documentExpiry") as string | null;

    console.log("Updating user with ID:", userId);

    // Fetch the user to ensure it exists
    let user;
    try {
      user = await client.users.getUser(userId?.toString() || "");
    } catch (err) {
      console.error(`Error fetching user with ID ${userId}:`, err);
      throw new Error(`User with ID ${userId} not found`);
    }

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Update the user's primary email address if it differs
    if (user.emailAddresses[0]?.emailAddress !== email) {
      const emailId = user.emailAddresses.find(
        (e) => e.emailAddress === email
      )?.id;
      if (emailId) {
        await client.users.updateUser(userId, {
          primaryEmailAddressID: emailId,
        });
      } else {
        console.error("Email address not found for user");
      }
    }

    // Obtener los metadatos existentes
    const currentMetadata = user.publicMetadata || {};

    // Actualizar los metadatos con los nuevos campos
    const updatedMetadata = {
      ...currentMetadata,
      phone: phone || "",
      address: address || "",
      governmentId: governmentId || "",
      emergencyContactName: emergencyContactName || "",
      emergencyContactPhone: emergencyContactPhone || "",
      birthDate: birthDate || "",
      hireDate: hireDate || "",
      documentExpiry: documentExpiry || "",
    };

    console.log("Actualizando metadatos del usuario:", {
      userId,
      firstName,
      lastName,
      email,
      phone,
      address,
      governmentId,
      emergencyContactName,
      emergencyContactPhone,
      birthDate,
      hireDate,
      documentExpiry,
      metadata: updatedMetadata,
    });

    // Update the user's name and metadata
    await client.users.updateUser(userId, {
      firstName,
      lastName,
      publicMetadata: updatedMetadata,
    });

    revalidatePath("/admin");
  } catch (err) {
    console.error("Error updating user:", err);
  }
}

export async function updateRole(userId: string, role: string): Promise<void> {
  const client = await clerkClient();

  try {
    console.log("Updating role for user ID:", userId, "to role:", role);

    // Verificar si el usuario actual es un manager
    const { sessionClaims } = await auth();
    const currentUserRole = sessionClaims?.metadata.role as string;
    const isManager = currentUserRole === "manager";

    // Si el usuario es manager y está intentando asignar el rol de manager, no permitirlo
    if (isManager && role === "manager") {
      console.error(
        "Los managers no pueden asignar el rol de manager a otros usuarios"
      );
      throw new Error(
        "Los managers no pueden asignar el rol de manager a otros usuarios"
      );
    }

    // Fetch the current user to get existing metadata
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata || {};

    // Update only the role field in the metadata
    const updatedMetadata = {
      ...currentMetadata,
      role,
    };

    await client.users.updateUser(userId, {
      publicMetadata: updatedMetadata,
    });

    revalidatePath("/admin");
  } catch (err) {
    console.error("Error updating role:", err);
    throw new Error("Failed to update user role.");
  }
}
