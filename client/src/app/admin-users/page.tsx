// src/app/admin/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUserWithTenant } from "@/lib/user";
import { ensureAdminOrManagerRole, getUsersByRole } from "@/utils/adminUtils";
import { UserCardReadOnly } from "../../components/admin/UserCardReadOnly";
import { getPlainUser } from "@/utils/userUtils";
import { CreateManagerForm } from "../../components/admin/CreateManagerForm";
import { Button } from "@/components/ui/button";

export default async function AdminUsers() {
  try {
    console.log("Iniciando carga de página admin-users");

    await ensureAdminOrManagerRole();
    console.log("Verificación de rol completada");

    const currentUserData = await getCurrentUserWithTenant();

    if (!currentUserData) {
      console.error("No user data found");
      redirect("/");
    }

    // Obtener todos los usuarios con rol "manager" sin filtrar por tenant
    console.log("Obteniendo usuarios con rol manager");
    const managerUsers = await getUsersByRole("manager");
    console.log(
      `Se encontraron ${managerUsers.length} usuarios con rol manager`
    );

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-8">
            <div className="flex items-center gap-3 mb-4 p-8">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
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
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestión de Gerentes
                </h1>
                <p className="text-gray-600 mt-1">
                  Administra los gerentes del sistema.
                </p>
                <p className="text-gray-600 mt-1">
                  Los gerentes tienen acceso completo a los módulos de su hotel.
                </p>
              </div>
            </div>
          </div>

          {managerUsers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
              <div className="flex justify-end pb-4">
                <CreateManagerForm />
              </div>
              <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay gerentes registrados
              </h3>
              <p className="text-gray-600">
                Comienza agregando el primer gerente al sistema
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
              <div className="flex justify-end pb-4">
                <CreateManagerForm />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {managerUsers.map((user) => (
                  <UserCardReadOnly key={user.id} user={getPlainUser(user)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error en página admin-users:", error);
    // En lugar de redirigir, mostramos un mensaje de error descriptivo
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Error de Carga
                  </h1>
                  <p className="text-gray-600 mt-1">
                    No se pudo cargar la página de administración
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Error al cargar gerentes
                </h3>
                <p className="text-red-700 mb-4">
                  Ha ocurrido un error al cargar la página de administración de
                  gerentes.
                </p>
                <div className="bg-red-100 border border-red-300 rounded-md p-4 mb-4">
                  <p className="font-medium text-red-800 mb-2">
                    Detalles del error:
                  </p>
                  <pre className="text-sm text-red-700 overflow-auto">
                    {error instanceof Error
                      ? error.message
                      : "Error desconocido"}
                  </pre>
                </div>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {}}
                  asChild
                >
                  <a href="/admin-users">Intentar nuevamente</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
