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

  if (!currentUserData || !currentUserData.tenantId) {
    console.log("No se encontró el ID de inquilino del usuario actual.");
    redirect("/");
  }

  const users = await getFilteredUsers(query, currentUserData.tenantId);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-8">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
                <p className="text-gray-600 mt-1">
                  Administra los empleados de tu hotel
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <SearchUsers />
              <CreateUserForm tenantId={currentUserData.tenantId} />
            </div>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay empleados registrados
            </h3>
            <p className="text-gray-600">Comienza agregando el un empleado</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Empleados del Hotel ({users.length})
              </h2>
              <p className="text-gray-600">
                Gestiona los empleados y sus roles en el sistema
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <UserCard key={user.id} user={getPlainUser(user)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
