// src/types/user.ts
export interface User {
    id: string;
    email: string;
    role: "admin" | "user" | "manager";
    tenantID: string; // Added tenantID field
}
