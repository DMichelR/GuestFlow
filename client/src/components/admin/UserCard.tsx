// src/components/admin/UserCard.tsx
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EditUserForm } from "./EditUserForm";
import { getPlainUser } from "@/utils/userUtils";
import { Button } from "@/components/ui/button";

export function UserCard({ user }: { user: ReturnType<typeof getPlainUser> }) {
  const roleColors: Record<string, string> = {
    admin: "bg-red-500",
    manager: "bg-blue-500",
    user: "bg-green-500",
    receptionist: "bg-yellow-500",
    staff: "bg-purple-500",
  };

  const roleColor = roleColors[user.role] || "bg-gray-500";

  const handleSave = (updatedUser: {
    firstName: string;
    lastName: string;
    email: string;
  }) => {
    console.log("Saving user: ", updatedUser);
  };

  return (
    <Card key={user.id} className="overflow-hidden">
      <CardHeader className={`h-8 ${roleColor}`}></CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm mb-2">
              Name: {user.firstName} {user.lastName}
            </p>
            <p className="text-sm mb-2">Email: {user.email}</p>
            <p className="text-sm mb-4">
              Role: <span className="font-medium">{user.role}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <EditUserForm
              user={{
                id: user.id, // Added the user ID
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              }}
              onSave={handleSave}
            />

            <form action="/api/update-role" method="POST">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="role" value="manager" />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full"
              >
                Manager
              </Button>
            </form>

            <form action="/api/update-role" method="POST">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="role" value="receptionist" />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full"
              >
                Receptionist
              </Button>
            </form>

            <form action="/api/update-role" method="POST">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="role" value="staff" />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full"
              >
                Staff
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
