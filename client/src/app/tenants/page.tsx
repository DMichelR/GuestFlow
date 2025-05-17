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

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const data = await getAllTenants();
        setTenants(data);
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
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardHeader>
                <CardTitle>{tenant.name}</CardTitle>
                <CardDescription>ID: {tenant.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end space-x-2">
                  {/* Botón de Ver detalles desactivado temporalmente
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tenants/${tenant.id}`}>Ver detalles</Link>
                  </Button>
                  */}
                  {/* Botón de Editar desactivado temporalmente
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tenants/${tenant.id}/edit`}>Editar</Link>
                  </Button>
                  */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
