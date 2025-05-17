// src/lib/user.ts
import { currentUser } from "@clerk/nextjs/server";

export async function getCurrentUserWithTenant() {
  const user = await currentUser();

  if (!user) {
    console.error("No se pudo obtener el usuario actual");
    return null;
  }

  // Get tenantId from metadata
  const tenantId = (user.publicMetadata.tenantId as string) || "";
  const role = (user.publicMetadata.role as string) || "user";

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || "No email",
    role,
    tenantId,
  };
}

export async function updateUserTenant(userId: string, tenantId: string) {
  // Your API call to update user tenant
  const response = await fetch("/api/user/tenant", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, tenantId }),
  });

  return response.json();
}
