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
    tenantId: user.publicMetadata.tenantId as string,
    tenantName: user.publicMetadata.tenantName as string,
    // Campos adicionales para el formulario de edición
    phone: (user.publicMetadata.phone as string) || "",
    address: (user.publicMetadata.address as string) || "",
    governmentId: (user.publicMetadata.governmentId as string) || "",
    emergencyContactName:
      (user.publicMetadata.emergencyContactName as string) || "",
    emergencyContactPhone:
      (user.publicMetadata.emergencyContactPhone as string) || "",
    birthDate: (user.publicMetadata.birthDate as string) || "",
    hireDate: (user.publicMetadata.hireDate as string) || "",
    documentExpiry: (user.publicMetadata.documentExpiry as string) || "",
  };
}
