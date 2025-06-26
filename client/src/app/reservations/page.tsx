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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
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
            Cargando reservas
          </h3>
          <p className="text-sm text-gray-500">
            Obteniendo la información de las reservaciones...
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
            onClick={() => fetchReservations()}
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
                Gestión de Reservas
              </h1>
              <p className="text-gray-600">
                Administre y controle todas las reservas del hotel
              </p>
            </div>
            {!isStaffUser && (
              <Button
                asChild
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 text-lg"
              >
                <Link href="/reservations/create">Nueva Reserva</Link>
              </Button>
            )}
          </div>

          {reservations.length === 0 ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
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
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay reservaciones registradas
              </h3>
              <p className="text-gray-600 mb-6">
                Comience creando su primera reserva para el hotel
              </p>
              {!isStaffUser && (
                <Button
                  asChild
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3"
                >
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
                                    Estado{" "}
                                    <ChevronDown className="ml-1 h-4 w-4" />
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
      </div>
    </div>
  );
}
