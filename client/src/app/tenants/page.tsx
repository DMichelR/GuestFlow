"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tenant, getAllTenants } from "@/utils/tenantService";

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tenantId: string;
}

interface TenantWithManagers extends Tenant {
  managers?: Manager[];
  managerCount?: number;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithManagers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        // Obtener la lista básica de tenants
        const data = await getAllTenants();
        console.log("Tenants básicos obtenidos:", data);

        // Obtener todos los managers desde la API
        const managersResponse = await fetch("/api/users/managers");
        let allManagers: Manager[] = [];

        if (managersResponse.ok) {
          allManagers = await managersResponse.json();
          console.log("Todos los managers obtenidos:", allManagers);
        } else {
          console.error(
            "Error al obtener managers:",
            managersResponse.statusText
          );
        }

        // Agregar la cuenta de managers a cada tenant
        const tenantsWithManagers = data.map((tenant) => {
          // Filtrar solo los managers del tenant actual
          const tenantManagers = allManagers.filter(
            (manager: Manager) => manager.tenantId === tenant.id
          );

          console.log(`Managers para tenant ${tenant.id}:`, tenantManagers);

          return {
            ...tenant,
            managers: tenantManagers,
            managerCount: tenantManagers.length,
          };
        });

        console.log("Tenants con managers:", tenantsWithManagers);
        setTenants(tenantsWithManagers);
      } catch (err) {
        console.error("Error fetching tenants:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar los hoteles"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Hoteles</h1>
        <div className="flex justify-center items-center h-64">
          <p>Cargando hoteles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Hoteles</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>Error: {error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hoteles</h1>
        <Button asChild>
          <Link href="/tenants/create">Agregar Hotel</Link>
        </Button>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-md text-center">
          <p className="text-gray-600 mb-4">No hay hoteles registrados</p>
          <Button asChild>
            <Link href="/tenants/create">Agregar el primer hotel</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => {
            console.log(
              `Renderizando tenant ${tenant.id} con ${tenant.managerCount} gerentes`
            );
            return (
              <Card key={tenant.id}>
                <CardHeader>
                  <CardTitle>{tenant.name}</CardTitle>
                  <CardDescription>
                    {tenant.managerCount === 1
                      ? "1 gerente asignado"
                      : `${tenant.managerCount} gerentes asignados`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {tenant.address && (
                      <div className="text-sm">
                        <span className="font-medium">Dirección:</span>{" "}
                        {tenant.address}
                      </div>
                    )}
                    {(tenant.cityName || tenant.countryName) && (
                      <div className="text-sm">
                        <span className="font-medium">Ubicación:</span>{" "}
                        {[tenant.cityName, tenant.countryName]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tenants/${tenant.id}`}>Ver detalles</Link>
                    </Button>
                    {/* Botón de Editar desactivado temporalmente
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tenants/${tenant.id}/edit`}>Editar</Link>
                    </Button>
                    */}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
