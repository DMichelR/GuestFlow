// src/utils/adminUtils.ts
import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { clerkClient } from "@clerk/nextjs/server";

export async function ensureManagerRole() {
  if (!(await checkRole("manager"))) {
    redirect("/");
  }
}

export async function getFilteredUsers(
  query: string | undefined,
  tenantID: string
) {
  const client = await clerkClient();
  const allUsers = query
    ? (await client.users.getUserList({ query })).data
    : (await client.users.getUserList()).data;

  return allUsers.filter(
    (user) =>
      user.publicMetadata.tenantId === tenantID ||
      user.publicMetadata.tenantID === tenantID
  );
}
