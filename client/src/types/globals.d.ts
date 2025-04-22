export {}

// Create a type for the roles
export type Roles = 'manager' | 'receptionist' | 'staff';

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role?: Roles
        }
    }
}
