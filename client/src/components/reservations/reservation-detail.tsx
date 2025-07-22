"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Calendar, Pencil, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Reservation,
  formatDate,
  getReservationById,
  getStateLabel,
  getStateVariant,
} from "@/utils/reservationService";
import {
  ServiceTicket,
  getServiceTicketsByReservationId,
} from "@/utils/serviceService";

interface ReservationDetailProps {
  reservationId: string;
}

export default function ReservationDetail({
  reservationId,
}: ReservationDetailProps) {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Obtener la reserva y las boletas de servicio en paralelo
        const [reservationData, ticketsData] = await Promise.all([
          getReservationById(reservationId),
          getServiceTicketsByReservationId(reservationId),
        ]);

        setReservation(reservationData);
        setServiceTickets(ticketsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar los datos"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reservationId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "No se pudo cargar la información de la reserva"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calcular el total de las boletas de servicio
  const serviceTicketsTotal = serviceTickets.reduce(
    (sum, ticket) => sum + ticket.price,
    0
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href={`/services/create?reservationId=${reservation.id}`}>
              Añadir boleta de servicio
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/reservations/${reservationId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar Reserva
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Reserva #{reservation.id.substring(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    Creada el {formatDate(reservation.reservationDate)}
                  </CardDescription>
                </div>
                <Badge variant={getStateVariant(reservation.state)}>
                  {getStateLabel(reservation.state)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-lg">Titular</h3>
                <div className="mt-2">
                  <p className="text-lg">{reservation.holderName}</p>
                  <p className="text-sm text-muted-foreground">
                    {reservation.holderEmail}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium">Fechas</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        Llegada: {formatDate(reservation.arrivalDate)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        Salida: {formatDate(reservation.departureDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Detalles</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {reservation.pax}{" "}
                        {reservation.pax === 1 ? "persona" : "personas"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Motivo de visita:{" "}
                      </span>
                      <span>{reservation.visitReasonName}</span>
                    </div>
                    {reservation.companyName && (
                      <div>
                        <span className="text-muted-foreground">Empresa: </span>
                        <span>{reservation.companyName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {reservation.finalPrice !== null && (
                <div>
                  <h3 className="font-medium">Precio final</h3>
                  <p className="mt-2 text-xl">
                    ${reservation.finalPrice.toFixed(2)}
                  </p>
                </div>
              )}

              {reservation.notes && (
                <div>
                  <h3 className="font-medium">Notas</h3>
                  <p className="mt-2 text-gray-700">{reservation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección de Boletas de Servicio */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Boletas de Servicio</CardTitle>
              <CardDescription>
                Servicios asociados a esta Reserva
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serviceTickets.length > 0 ? (
                <Table>
                  <TableCaption>
                    Total: ${serviceTicketsTotal.toFixed(2)}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Registrado por</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          {ticket.serviceName}
                        </TableCell>
                        <TableCell>{formatDate(ticket.created)}</TableCell>
                        <TableCell>{ticket.userName}</TableCell>
                        <TableCell className="text-right">
                          ${ticket.price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">
                  No hay boletas de servicio asociadas a esta Reserva
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Habitaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reservation.assignedRooms.length > 0 ? (
                  reservation.assignedRooms.map((room, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {room}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No hay habitaciones asignadas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Huéspedes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-medium">Titular</div>
                <p>{reservation.holderName}</p>

                {reservation.guests.length > 0 && (
                  <>
                    <div className="font-medium mt-4">
                      Huéspedes adicionales
                    </div>
                    <ul className="list-disc pl-5">
                      {reservation.guests.map((guest, index) => (
                        <li key={index}>{guest}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
