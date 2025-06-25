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
  changeReservationState,
  formatDate,
  getAllReservations,
  getStateLabel,
  getStateVariant,
  isToday,
} from "@/utils/reservationService";
import { useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata.role as string;
      setUserRole(role);
    }
  }, [isLoaded, user]);

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

  useEffect(() => {
    fetchReservations();
  }, []);

  // Función para manejar el cambio de estado
  const handleStateChange = async (
    id: string,
    newState: StayState,
    reservation: Reservation
  ) => {
    try {
      setActionLoading(id);

      // Validaciones según las reglas de negocio
      if (
        newState === StayState.Canceled &&
        reservation.state !== StayState.Pending
      ) {
        throw new Error(
          "Solo se pueden cancelar reservaciones en estado pendiente"
        );
      }

      if (
        newState === StayState.Active &&
        reservation.state !== StayState.Pending
      ) {
        throw new Error(
          "Solo se puede hacer check-in a reservaciones en estado pendiente"
        );
      }

      if (newState === StayState.Active && !isToday(reservation.arrivalDate)) {
        throw new Error(
          "Solo se puede hacer check-in en la fecha de llegada programada"
        );
      }

      if (
        newState === StayState.Completed &&
        reservation.state !== StayState.Active
      ) {
        throw new Error(
          "Solo se puede hacer check-out a reservaciones en estado activo"
        );
      }

      await changeReservationState(id, newState);
      // Refrescar la lista de reservaciones
      await fetchReservations();
    } catch (error) {
      console.error("Error changing reservation state:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error al cambiar el estado de la Reserva"
      );
    } finally {
      setActionLoading(null);
    }
  };

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
            onClick={() => fetchReservations()}
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reservas</h1>
        {!isStaffUser && (
          <Button asChild>
            <Link href="/reservations/create">Nueva Reserva</Link>
          </Button>
        )}
      </div>

      {reservations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-md text-center">
          <p className="text-gray-600 mb-4">No hay reservaciones registradas</p>
          {!isStaffUser && (
            <Button asChild>
              <Link href="/reservations/create">Crear primera Reserva</Link>
            </Button>
          )}
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
                          {!isStaffUser && (
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/reservations/${reservation.id}/edit`}
                              >
                                Editar
                              </Link>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/services/create?reservationId=${reservation.id}`}
                            >
                              Añadir boleta
                            </Link>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoading === reservation.id}
                              >
                                Estado <ChevronDown className="ml-1 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {/* Opciones según el estado actual */}
                              {reservation.state === StayState.Pending && (
                                <>
                                  {/* Mostrar Check-in solo si la fecha actual coincide con la fecha de llegada */}
                                  {isToday(reservation.arrivalDate) && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStateChange(
                                          reservation.id,
                                          StayState.Active,
                                          reservation
                                        )
                                      }
                                    >
                                      Check-in
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStateChange(
                                        reservation.id,
                                        StayState.Canceled,
                                        reservation
                                      )
                                    }
                                  >
                                    Cancelar
                                  </DropdownMenuItem>
                                </>
                              )}
                              {reservation.state === StayState.Active && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStateChange(
                                      reservation.id,
                                      StayState.Completed,
                                      reservation
                                    )
                                  }
                                >
                                  Check-out
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
