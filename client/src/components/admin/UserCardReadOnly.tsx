// src/components/admin/UserCardReadOnly.tsx
"use client";

import { Card, CardContent, CardHeader } from "../ui/card";
import { getPlainUser } from "@/utils/userUtils";
import { Badge } from "../ui/badge";

export function UserCardReadOnly({
  user,
}: {
  user: ReturnType<typeof getPlainUser>;
}) {
  const roleColors: Record<string, string> = {
    admin: "bg-red-500",
    manager: "bg-blue-500",
    user: "bg-green-500",
    receptionist: "bg-yellow-500",
    staff: "bg-purple-500",
  };

  const roleBadgeVariant: Record<
    string,
    "default" | "outline" | "secondary" | "destructive"
  > = {
    admin: "destructive",
    manager: "default",
    receptionist: "secondary",
    staff: "outline",
  };

  const roleColor = roleColors[user.role] || "bg-gray-500";
  const badgeVariant = roleBadgeVariant[user.role] || "default";

  return (
    <Card key={user.id} className="overflow-hidden">
      <CardHeader className={`h-8 ${roleColor}`}></CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                {user.firstName} {user.lastName}
              </h3>
              <Badge variant={badgeVariant}>{user.role}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-2">{user.email}</p>

            {user.tenantName && (
              <p className="text-sm text-gray-700 mt-4">
                <span className="font-medium">Hotel:</span> {user.tenantName}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
