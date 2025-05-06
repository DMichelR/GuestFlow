// src/app/admin/page.tsx
import { redirect } from "next/navigation";
import { SearchUsers } from "../../components/admin/SearchUsers";
import { CreateUserForm } from "../../components/admin/CreateUserForm";
import { getCurrentUserWithTenant } from "@/lib/user";
import { ensureManagerRole, getFilteredUsers } from "@/utils/adminUtils";
import { UserCard } from "../../components/admin/UserCard";
import { getPlainUser } from "@/utils/userUtils";

export default async function AdminDashboard(params: {
  searchParams: Promise<{ search?: string }>;
}) {
  await ensureManagerRole();

  const query = (await params.searchParams).search;
  const currentUserData = await getCurrentUserWithTenant();

  if (!currentUserData || !currentUserData.tenantID) {
    redirect("/");
  }

  const users = await getFilteredUsers(query, currentUserData.tenantID);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="flex justify-between items-center mb-6">
        <SearchUsers />
        <CreateUserForm tenantId={currentUserData.tenantID} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <UserCard key={user.id} user={getPlainUser(user)} />
        ))}
      </div>
    </div>
  );
}
