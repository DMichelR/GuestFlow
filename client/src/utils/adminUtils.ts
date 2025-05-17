// src/utils/adminUtils.ts
import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

export async function ensureManagerRole() {
  if (!(await checkRole("manager"))) {
    console.log("Acceso denegado: rol no autorizado");
    redirect("/");
  }
}

export async function ensureAdminOrManagerRole() {
  const { sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata.role as string;

  console.log("Verificando rol para acceso a admin-users:", userRole);

  if (userRole !== "admin" && userRole !== "manager") {
    console.log("Acceso denegado: rol no autorizado:", userRole);
    redirect("/");
  }

  console.log("Acceso permitido para rol:", userRole);
}

export async function getFilteredUsers(
  query: string | undefined,
  tenantId: string
) {
  const client = await clerkClient();
  const allUsers = query
    ? (await client.users.getUserList({ query })).data
    : (await client.users.getUserList()).data;

  return allUsers.filter(
    (user) =>
      user.publicMetadata.tenantId === tenantId
  );
}

export async function getUsersByRole(role: string) {
  const client = await clerkClient();
  const allUsers = await client.users.getUserList();

  return allUsers.data.filter((user) => user.publicMetadata.role === role);
}
