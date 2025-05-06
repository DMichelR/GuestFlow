// src/types/user.ts
export interface User {
  id: string;
  emailAddresses: { id: string; emailAddress: string }[];
  primaryEmailAddressId: string;
  firstName: string | null; // Allows null for compatibility
  lastName: string | null; // Allows null for compatibility
  publicMetadata: { role?: string };
  tenantID?: string; // Optional tenant ID
  role: "admin" | "staff" | "manager" | "receptionist"; // Role field
}
