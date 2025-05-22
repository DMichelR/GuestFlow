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
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Gestión de Managers</h1>
          <div className="flex items-center">
            <div className="flex justify-between items-center mb-6">
              <CreateManagerForm />
            </div>
          </div>
        </div>

        {managerUsers.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">
              No hay managers registrados
            </h3>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Mostrando {managerUsers.length} managers de todos los hoteles. Los
              managers tienen acceso completo a los módulos de su hotel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managerUsers.map((user) => (
                <UserCardReadOnly key={user.id} user={getPlainUser(user)} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error en página admin-users:", error);
    // En lugar de redirigir, mostramos un mensaje de error descriptivo
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-red-600">Error</h1>
        <p className="text-lg">
          Ha ocurrido un error al cargar la página de administración de
          managers.
        </p>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
          <p className="font-medium">Detalles del error:</p>
          <pre className="mt-2 text-sm overflow-auto">
            {error instanceof Error ? error.message : "Error desconocido"}
          </pre>
        </div>
        <Button variant="default" className="mt-6" onClick={() => {}} asChild>
          <a href="/admin-users">Intentar nuevamente</a>
        </Button>
      </div>
    );
  }
}
