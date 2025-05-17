import { Roles } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

// Define la jerarquía de roles (mayor nivel de acceso primero)
const roleHierarchy = ["admin", "manager", "receptionist", "staff"];

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata.role as string;

  // Si el usuario tiene exactamente el rol requerido, permitir acceso
  if (userRole === role) return true;

  // Verificar si el usuario tiene un rol superior al requerido
  const requiredRoleIndex = roleHierarchy.indexOf(role);
  const userRoleIndex = roleHierarchy.indexOf(userRole);

  // Un índice menor significa un rol superior en nuestra jerarquía
  // (porque el array está ordenado de mayor a menor autoridad)
  return userRoleIndex >= 0 && userRoleIndex < requiredRoleIndex;
};
