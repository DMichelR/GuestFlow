"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Guest, getAllGuests } from "@/utils/guestService";

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata.role as string;
      setUserRole(role);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setLoading(true);
        const data = await getAllGuests();
        setGuests(data);
      } catch (err) {
        console.error("Error fetching guests:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar los huéspedes"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg
              className="h-6 w-6 animate-spin text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Cargando huéspedes
          </h3>
          <p className="text-sm text-gray-500">
            Obteniendo la información de los huéspedes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Error al cargar
          </h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-gray-300 hover:border-red-500 hover:text-red-600"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Verificar si el usuario tiene rol "staff"
  const isStaffUser = userRole === "staff";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestión de Huéspedes
              </h1>
              <p className="text-gray-600">
                Administre y controle la información de todos los huéspedes
              </p>
            </div>
            {!isStaffUser && (
              <Button
                asChild
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 text-lg"
              >
                <Link href="/guests/create">Agregar Huésped</Link>
              </Button>
            )}
          </div>

          {guests.length === 0 ? (
            <div className="bg-cyan-50 border-l-4 border-cyan-500 rounded-r-lg p-8 text-center">
              <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-8 h-8 text-white"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay huéspedes registrados
              </h3>
              <p className="text-gray-600 mb-6">
                Comience agregando el primer huésped al sistema
              </p>
              {!isStaffUser && (
                <Button
                  asChild
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3"
                >
                  <Link href="/guests/create">Registrar primer huésped</Link>
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Listado de Huéspedes</CardTitle>
                <CardDescription>
                  Administre los huéspedes de su hotel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Identificación</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Fecha de Nacimiento</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guests.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {guest.name} {guest.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {guest.address || "Sin dirección"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{guest.cid}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p>{guest.email}</p>
                              <p className="text-sm text-muted-foreground">
                                {guest.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(guest.birthday).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/guests/${guest.id}`}>Ver</Link>
                              </Button>
                              {!isStaffUser && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/guests/${guest.id}/edit`}>
                                    Editar
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
