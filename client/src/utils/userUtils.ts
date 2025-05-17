import { User } from "@clerk/backend";

export function getPlainUser(user: User) {
  return {
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email:
      user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
      )?.emailAddress || "",
    role: (user.publicMetadata.role as string) || "No role",
    tenantId: (user.publicMetadata.tenantId) as string,
    tenantName: user.publicMetadata.tenantName as string,
  };
}
