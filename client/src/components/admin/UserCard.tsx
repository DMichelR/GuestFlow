// src/components/admin/UserCard.tsx
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EditUserForm } from "./EditUserForm";
import { getPlainUser } from "@/utils/userUtils";
import { updateRole } from "../../app/admin/_actions";
import { User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@clerk/nextjs";

export function UserCard({ user }: { user: ReturnType<typeof getPlainUser> }) {
  const { user: currentUser, isLoaded } = useUser();
  const currentUserRole = isLoaded
    ? (currentUser?.publicMetadata?.role as string)
    : "";
  const isManagerUser = currentUserRole === "manager";

  const roleColors: Record<string, string> = {
    admin: "bg-red-500 text-red-500",
    manager: "bg-blue-500 text-blue-500",
    user: "bg-green-500 text-green-500",
    receptionist: "bg-orange-500 text-orange-500",
    staff: "bg-indigo-500 text-indigo-500",
  };

  const [bgColor, textColor] = roleColors[user.role]?.split(" ") || [
    "bg-gray-500",
    "text-gray-500",
  ];

  const handleRoleUpdate = async (role: string) => {
    try {
      await updateRole(user.id, role);
      console.log(`Role updated to ${role} for user ${user.id}`);
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  // Si el usuario actual es un manager, no debería ver la opción de manager
  const availableRoles = isManagerUser
    ? [
        {
          value: "receptionist",
          label: "Recepcionista",
          color: "text-orange-500",
        },
        { value: "staff", label: "Botones", color: "text-indigo-500" },
      ]
    : [
        { value: "manager", label: "Gerente", color: "text-blue-500" },
        {
          value: "receptionist",
          label: "Recepcionista",
          color: "text-orange-500",
        },
        { value: "staff", label: "Botones", color: "text-indigo-500" },
      ];

  return (
    <Card
      key={user.id}
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <CardHeader
        className={`${bgColor} py-3 px-4 flex flex-row items-center gap-2`}
      >
        <div className="bg-white rounded-full p-1">
          <User className={`h-5 w-5 ${textColor}`} />
        </div>
        <span className="text-white font-medium capitalize">{user.role}</span>
      </CardHeader>
      <CardContent className="pt-4 pb-5 px-5">
        <div className="flex justify-between items-start gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <p className="text-sm text-slate-600 flex flex-col">
              <span className="font-medium text-xs uppercase text-slate-400">
                Email
              </span>
              {user.email}
            </p>
          </div>

          <div className="flex flex-col gap-2 min-w-[150px]">
            <EditUserForm
              user={{
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone || "",
                address: user.address || "",
                governmentId: user.governmentId || "",
                emergencyContactName: user.emergencyContactName || "",
                emergencyContactPhone: user.emergencyContactPhone || "",
                birthDate: user.birthDate || "",
                hireDate: user.hireDate || "",
                documentExpiry: user.documentExpiry || "",
              }}
              onSave={(updatedUser) =>
                console.log("User updated:", updatedUser)
              }
            />

            <div className="text-xs font-medium text-slate-500 mt-3 mb-1">
              Cambiar rol:
            </div>
            {isLoaded && currentUser?.id === user.id ? (
              <div className="text-xs text-amber-600">
                No puedes cambiar tu propio rol
              </div>
            ) : (
              <Select defaultValue={user.role} onValueChange={handleRoleUpdate}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem
                      key={role.value}
                      value={role.value}
                      className={role.color}
                      disabled={user.role === role.value}
                    >
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
