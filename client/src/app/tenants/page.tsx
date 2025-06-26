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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Hoteles</h1>
                <p className="text-gray-600 mt-1">
                  Administra los hoteles del sistema
                </p>
              </div>
            </div>

            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Cargando hoteles...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
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
                  No se pudieron cargar los hoteles
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700 mb-4">Error: {error}</p>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Hoteles</h1>
                  <p className="text-gray-600 mt-1">
                    Administra los hoteles del sistema
                  </p>
                </div>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                asChild
              >
                <Link href="/tenants/create">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Agregar Hotel
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {tenants.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay hoteles registrados
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando el primer hotel al sistema
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              asChild
            >
              <Link href="/tenants/create">Agregar el primer hotel</Link>
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Hoteles Registrados ({tenants.length})
              </h2>
              <p className="text-gray-600">
                Gestiona los hoteles y sus respectivos gerentes
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants.map((tenant) => {
                console.log(
                  `Renderizando tenant ${tenant.id} con ${tenant.managerCount} gerentes`
                );
                return (
                  <Card
                    key={tenant.id}
                    className="hover:shadow-md transition-shadow border-gray-100"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-gray-900">
                        {tenant.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {tenant.managerCount === 1
                          ? "1 gerente asignado"
                          : `${tenant.managerCount} gerentes asignados`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {tenant.address && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">
                              Dirección:
                            </span>{" "}
                            <span className="text-gray-600">
                              {tenant.address}
                            </span>
                          </div>
                        )}
                        {(tenant.cityName || tenant.countryName) && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">
                              Ubicación:
                            </span>{" "}
                            <span className="text-gray-600">
                              {[tenant.cityName, tenant.countryName]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          asChild
                        >
                          <Link href={`/tenants/${tenant.id}`}>
                            Ver detalles
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
