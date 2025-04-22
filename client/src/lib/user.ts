// src/lib/user.ts
import { currentUser } from "@clerk/nextjs/server";

export async function getCurrentUserWithTenant() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    // Get tenantID from metadata
    const tenantID = user.publicMetadata.tenantID as string || "";
    const role = user.publicMetadata.role as string || "user";

    return {
        id: user.id,
        email: user.emailAddresses[0].emailAddress,
        role,
        tenantID
    };
}

export async function updateUserTenant(userId: string, tenantID: string) {
    // Your API call to update user tenant
    const response = await fetch("/api/user/tenant", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, tenantID }),
    });

    return response.json();
}
