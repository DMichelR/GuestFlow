// src/app/admin/_actions.ts
"use server";

import { checkRole } from "@/utils/roles";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function setRole(formData: FormData): Promise<void> {
  const client = await clerkClient();

  if (!(await checkRole("manager"))) {
    throw new Error("Not Authorized");
  }

  try {
    await client.users.updateUserMetadata(formData.get("id") as string, {
      publicMetadata: { role: formData.get("role") },
    });
    revalidatePath("/admin");
  } catch (err) {
    console.error("Error setting role:", err);
  }
}

export async function removeRole(formData: FormData): Promise<void> {
  const client = await clerkClient();

  try {
    await client.users.updateUserMetadata(formData.get("id") as string, {
      publicMetadata: { role: null },
    });
    revalidatePath("/admin");
  } catch (err) {
    console.error("Error removing role:", err);
  }
}

export async function createUser(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const client = await clerkClient();

  if (!(await checkRole("manager"))) {
    throw new Error("Not Authorized");
  }

  try {
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const role = formData.get("role") as string;
    const tenantId = formData.get("tenantId") as string;

    console.log("Creating user with:", {
      email,
      firstName,
      lastName,
      role,
      tenantId,
    });

    await client.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      password: formData.get("password") as string,
      publicMetadata: {
        role,
        tenantId,
      },
    });

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

    // Update the user's name
    await client.users.updateUser(userId, {
      firstName,
      lastName,
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
