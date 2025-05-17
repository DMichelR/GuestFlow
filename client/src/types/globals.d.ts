export {};

// Create a type for the roles
export type Roles = "admin" | "manager" | "receptionist" | "staff";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
}
