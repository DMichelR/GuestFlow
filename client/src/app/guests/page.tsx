"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Huéspedes</h1>
        <div className="flex justify-center items-center h-64">
          <p>Cargando huéspedes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Huéspedes</h1>
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
        <h1 className="text-3xl font-bold">Huéspedes</h1>
        <Button asChild>
          <Link href="/guests/create">Agregar Huésped</Link>
        </Button>
      </div>

      {guests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-md text-center">
          <p className="text-gray-600 mb-4">No hay huéspedes registrados</p>
          <Button asChild>
            <Link href="/guests/create">Registrar primer huésped</Link>
          </Button>
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
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/guests/${guest.id}/edit`}>
                              Editar
                            </Link>
                          </Button>
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
  );
}
