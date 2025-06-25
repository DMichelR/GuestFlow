"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenantById } from "@/utils/tenantService";
import { Manager } from "@/types/manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface TenantDetails {
  id: string;
  name: string;
  address?: string;
  countryId?: string;
  cityId?: string;
  countryName?: string;
  cityName?: string;
  isActive: boolean;
  created: string;
  updated: string;
  managers: Manager[];
}

export default function TenantDetailsPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        if (typeof id === "string") {
          // Obtener datos del tenant
          const data = await getTenantById(id);
          setTenant(data as TenantDetails);

          // Obtener managers desde la API de Clerk
          const response = await fetch("/api/users/managers");
          if (response.ok) {
            const allManagers = await response.json();
            console.log("Todos los managers:", allManagers);
            // Filtrar solo los managers del tenant actual
            const filteredManagers = allManagers.filter(
              (manager: Manager) => manager.tenantId === id
            );
            console.log("Managers filtrados:", filteredManagers);
            setManagers(filteredManagers);
          } else {
            console.error("Error al obtener managers:", response.statusText);
          }
        } else {
          throw new Error("ID de hotel inválido");
        }
      } catch (err) {
        console.error("Error fetching tenant:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar los detalles del hotel"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Detalles del Hotel</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <p>Cargando información del hotel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Detalles del Hotel</h1>
        </div>
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
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Detalles del Hotel</h1>
      </div>

      {tenant && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{tenant.name}</CardTitle>
              <CardDescription>ID: {tenant.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenant.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Dirección
                    </p>
                    <p>{tenant.address}</p>
                  </div>
                )}
                {tenant.countryName && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">País</p>
                    <p>{tenant.countryName}</p>
                  </div>
                )}
                {tenant.cityName && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ciudad</p>
                    <p>{tenant.cityName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <p>{tenant.isActive ? "Activo" : "Inactivo"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Creado</p>
                  <p>{formatDate(new Date(tenant.created))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Última actualización
                  </p>
                  <p>{formatDate(new Date(tenant.updated))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Gerentes del Hotel</h2>
            {managers && managers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {managers.map((manager) => (
                  <Card key={manager.id}>
                    <CardHeader>
                      <CardTitle>
                        {manager.firstName} {manager.lastName}
                      </CardTitle>
                      <CardDescription>{manager.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Teléfono
                          </p>
                          <p>{manager.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Creado
                          </p>
                          <p>{formatDate(new Date(manager.created))}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                <p className="text-yellow-800">
                  Este hotel no tiene gerentes asignados.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
