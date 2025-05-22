"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
  Reservation,
  StayState,
  formatDate,
  getAllReservations,
  getStateLabel,
  getStateVariant,
} from "@/utils/reservationService";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const data = await getAllReservations();
        setReservations(data);
      } catch (err) {
        console.error("Error fetching reservations:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar las reservaciones"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Reservaciones</h1>
        <div className="flex justify-center items-center h-64">
          <p>Cargando reservaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Reservaciones</h1>
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
        <h1 className="text-3xl font-bold">Reservaciones</h1>
        <Button asChild>
          <Link href="/reservations/create">Nueva Reservación</Link>
        </Button>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-md text-center">
          <p className="text-gray-600 mb-4">No hay reservaciones registradas</p>
          <Button asChild>
            <Link href="/reservations/create">Crear primera reservación</Link>
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado de Reservaciones</CardTitle>
            <CardDescription>
              Administre las reservaciones de su hotel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titular</TableHead>
                    <TableHead>Llegada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Habitaciones</TableHead>
                    <TableHead>Huéspedes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {reservation.holderName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reservation.holderEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(reservation.arrivalDate)}
                      </TableCell>
                      <TableCell>
                        {formatDate(reservation.departureDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {reservation.assignedRooms.map((room, index) => (
                            <Badge key={index} variant="outline">
                              {room}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{reservation.pax} personas</TableCell>
                      <TableCell>
                        <Badge variant={getStateVariant(reservation.state)}>
                          {getStateLabel(reservation.state)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/reservations/${reservation.id}`}>
                              Ver
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/reservations/${reservation.id}/edit`}>
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
