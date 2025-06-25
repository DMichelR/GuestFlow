"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UpdateReservationDto,
  Reservation,
  updateReservation,
  getReservationById,
} from "@/utils/reservationService";
import { Room, getAvailableRooms, getRoomById } from "@/utils/roomService";
import { Guest, getAllGuests } from "@/utils/guestService";
import { Company, getAllCompanies } from "@/utils/companyService";
import { VisitReason, getAllVisitReasons } from "@/utils/visitReasonService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Esquema de validación para el formulario de edición de reserva
const reservationFormSchema = z.object({
  visitReasonId: z.string().min(1, "Motivo de visita es obligatorio"),
  holderId: z.string().min(1, "Titular de la reserva es obligatorio"),
  arrivalDate: z.date({
    required_error: "La fecha de llegada es obligatoria",
  }),
  departureDate: z.date({
    required_error: "La fecha de salida es obligatoria",
  }),
  pax: z.coerce
    .number()
    .int()
    .min(1, "El número de ocupantes debe ser al menos 1"),
  finalPrice: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  roomIds: z
    .array(z.string())
    .min(1, "Debe seleccionar al menos una habitación"),
  guestIds: z.array(z.string()),
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

interface EditReservationFormProps {
  token: string;
  reservationId: string;
}

export default function EditReservationForm({
  reservationId,
}: EditReservationFormProps) {
  const router = useRouter();
  const [visitReasons, setVisitReasons] = useState<VisitReason[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [currentRooms, setCurrentRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [, setGuestsInitialized] = useState(false);

  // Formulario con valores por defecto
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      visitReasonId: "",
      holderId: "",
      arrivalDate: new Date(),
      departureDate: new Date(),
      pax: 1,
      finalPrice: null,
      notes: "",
      companyId: null,
      roomIds: [],
      guestIds: [],
    },
  });

  // Función para cargar habitaciones disponibles
  const fetchAvailableRooms = useCallback(
    async (
      arrival: Date,
      departure: Date,
      currentReservationId: string,
      roomsToUse: Room[] = []
    ) => {
      if (!arrival || !departure) return;

      try {
        setIsLoadingRooms(true);
        const rooms = await getAvailableRooms(
          arrival,
          departure,
          currentReservationId
        );

        // Format the rooms to ensure we have proper properties for compatibility
        const formattedAvailableRooms = rooms.map((room) => ({
          ...room,
          roomNumber: room.number || room.roomNumber,
          type: room.roomTypeName || room.type,
        }));

        // Depurar información de las habitaciones disponibles
        console.log(
          "Available rooms before deduplication:",
          formattedAvailableRooms
        );

        // Combinar habitaciones disponibles con las ya asignadas a esta reserva y eliminar duplicados
        const availableRoomsIds = new Set(
          formattedAvailableRooms.map((room) => room.id)
        );

        // Use roomsToUse parameter if provided, otherwise fall back to empty array
        const currentRoomsToUse = roomsToUse.length > 0 ? roomsToUse : [];

        // Make sure all rooms in currentRoomsToUse have the needed properties
        const formattedCurrentRooms = currentRoomsToUse.map((room) => ({
          ...room,
          roomNumber: room.number || room.roomNumber,
          type: room.roomTypeName || room.type,
        }));

        const combinedRooms = [
          ...formattedAvailableRooms,
          ...formattedCurrentRooms.filter(
            (room) => !availableRoomsIds.has(room.id)
          ),
        ];

        // Asegurarse de que todas las habitaciones tengan ID y number
        const fullRooms = combinedRooms.map((room) => {
          return {
            ...room,
            id: room.id,
            roomNumber: room.number || room.roomNumber,
            type: room.roomTypeName || room.type,
          };
        });

        console.log("Final room list with all properties:", fullRooms);
        setAvailableRooms(fullRooms);
      } catch (err) {
        console.error("Error fetching available rooms:", err);
        setError("Error al cargar habitaciones disponibles");
      } finally {
        setIsLoadingRooms(false);
      }
    },
    [] // Sin dependencias ya que siempre recibimos roomsToUse como parámetro
  );

  // Función para cargar los datos de la reserva
  const fetchReservationData = useCallback(async () => {
    if (!guests.length || !visitReasons.length || !companies.length) {
      return; // No cargar hasta que tengamos todos los datos necesarios
    }

    try {
      setIsLoading(true);
      // Obtener los datos de la reserva
      const reservationData = await getReservationById(reservationId);
      setReservation(reservationData);

      // Depurar los datos recibidos
      console.log("Reservation data inicial:", reservationData);

      // Cargar las habitaciones asignadas actualmente
      // Si assignedRooms contiene números de habitación en lugar de IDs, necesitamos convertirlos
      const roomPromises = reservationData.assignedRooms.map((roomIdOrNumber) =>
        getRoomById(roomIdOrNumber)
      );
      const currentRoomsData = await Promise.all(roomPromises);

      // Asegurarse de que tengan las propiedades necesarias para los componentes
      const formattedRooms = currentRoomsData.map((room) => ({
        ...room,
        roomNumber: room.number,
        type: room.roomTypeName,
      }));

      setCurrentRooms(formattedRooms);

      console.log("Assigned rooms:", reservationData.assignedRooms);
      console.log("Current rooms data detallado:", currentRoomsData);

      // Mapear las habitaciones para obtener sus IDs correctos
      const actualRoomIds = currentRoomsData.map((room) => room.id);
      console.log("Actual room IDs extraídos:", actualRoomIds);

      // Establecer los valores del formulario básicos
      form.setValue("visitReasonId", reservationData.visitReasonId);
      form.setValue("holderId", reservationData.holderId);
      form.setValue("arrivalDate", new Date(reservationData.arrivalDate));
      form.setValue("departureDate", new Date(reservationData.departureDate));
      form.setValue("pax", reservationData.pax);
      form.setValue("finalPrice", reservationData.finalPrice);
      form.setValue("notes", reservationData.notes);
      form.setValue("companyId", reservationData.companyId);

      // Usamos los IDs reales de las habitaciones obtenidos de los datos completos
      console.log("Room IDs being set:", actualRoomIds);
      form.setValue("roomIds", actualRoomIds, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Para los huéspedes, necesitamos determinar si el API está enviando nombres o IDs
      console.log("Guests from API:", reservationData.guests);

      // Si reservationData.guests contiene nombres en lugar de IDs,
      // necesitamos buscar los IDs correspondientes
      let actualGuestIds = reservationData.guests;

      // Comprobar si los elementos en reservationData.guests parecen nombres en lugar de IDs
      const seemsToBeNames = reservationData.guests.some(
        (guest) => typeof guest === "string" && guest.includes(" ")
      );

      if (seemsToBeNames && guests.length > 0) {
        // Si son nombres, buscaremos los IDs correspondientes
        actualGuestIds = [];
        for (const guestNameOrId of reservationData.guests) {
          // Buscar en la lista de huéspedes disponibles
          const matchingGuest = guests.find(
            (g) => g.name + " " + g.lastName === guestNameOrId
          );
          console.log(
            `Buscando huésped por nombre "${guestNameOrId}":`,
            matchingGuest
          );
          if (matchingGuest) {
            actualGuestIds.push(matchingGuest.id);
          }
        }
      }

      console.log("Guest IDs being set:", actualGuestIds);
      form.setValue("guestIds", actualGuestIds, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Marcar que los huéspedes ya han sido inicializados
      setGuestsInitialized(true);

      // Cargar habitaciones disponibles para las fechas de la reserva
      await fetchAvailableRooms(
        new Date(reservationData.arrivalDate),
        new Date(reservationData.departureDate),
        reservationData.id,
        currentRoomsData
      );
    } catch (error) {
      console.error("Error al cargar los datos de la reserva:", error);
      setError("No se pudo cargar la información de la reserva");
    } finally {
      setIsLoading(false);
    }
  }, [
    reservationId,
    guests,
    visitReasons,
    companies,
    form,
    fetchAvailableRooms,
  ]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [visitReasonsData, guestsData, companiesData] = await Promise.all(
          [getAllVisitReasons(), getAllGuests(), getAllCompanies()]
        );

        setVisitReasons(visitReasonsData);
        setGuests(guestsData);
        setCompanies(companiesData);
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Error al cargar los datos iniciales");
      }
    };

    fetchInitialData();
  }, []);

  // Cargar datos de la reserva una vez que tengamos los datos iniciales
  useEffect(() => {
    if (guests.length > 0 && visitReasons.length > 0 && companies.length > 0) {
      fetchReservationData();
    }
  }, [
    guests.length,
    visitReasons.length,
    companies.length,
    fetchReservationData,
  ]);

  // Cuando cambian las fechas, actualizar las habitaciones disponibles
  const onDateChange = () => {
    const arrivalDate = form.getValues("arrivalDate");
    const departureDate = form.getValues("departureDate");

    if (arrivalDate && departureDate && reservation) {
      // Pass the current rooms explicitly when dates change
      fetchAvailableRooms(
        arrivalDate,
        departureDate,
        reservation.id,
        currentRooms // Ahora currentRooms está disponible en el scope
      );
    }
  };

  async function onSubmit(data: ReservationFormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      // Obtener los valores actuales del formulario
      const formValues = form.getValues();
      console.log("Form values on submit:", formValues);

      // Asegurarse de que los IDs de habitación y huéspedes estén correctamente formateados
      const roomIds = (formValues.roomIds || [])
        .map((id) => String(id).trim())
        .filter(Boolean);
      const guestIds = (formValues.guestIds || [])
        .map((id) => String(id).trim())
        .filter(Boolean);

      console.log("Formatted room IDs:", roomIds);
      console.log("Formatted guest IDs:", guestIds);

      // Verificar cada habitación para asegurarnos de que estamos usando los IDs correctos
      const verifiedRoomIds = [];
      for (const roomId of roomIds) {
        // Si parece ser un número de habitación, buscar el ID correspondiente
        const foundRoom = availableRooms.find(
          (r) => r.id === roomId || r.number === roomId
        );
        if (foundRoom) {
          verifiedRoomIds.push(foundRoom.id); // Siempre usar el ID real
        } else {
          // Si no lo encontramos, mantener el valor original
          verifiedRoomIds.push(roomId);
        }
      }

      // Verificar cada huésped para asegurarnos de que estamos usando los IDs correctos
      const verifiedGuestIds = [];
      for (const guestId of guestIds) {
        // Verificar si tenemos un guest con este ID
        const foundGuest = guests.find((g) => g.id === guestId);
        if (foundGuest) {
          verifiedGuestIds.push(foundGuest.id);
        } else {
          // Si no lo encontramos, mantener el valor original
          verifiedGuestIds.push(guestId);
        }
      }

      console.log("Verified room IDs:", verifiedRoomIds);
      console.log("Verified guest IDs:", verifiedGuestIds);

      const updateData: UpdateReservationDto = {
        id: reservationId,
        holderId: data.holderId, // Agregamos holderId
        visitReasonId: data.visitReasonId,
        arrivalDate: data.arrivalDate,
        departureDate: data.departureDate,
        pax: data.pax,
        finalPrice: data.finalPrice,
        notes: data.notes,
        companyId: data.companyId === "none" ? null : data.companyId,
        roomIds: verifiedRoomIds,
        guestIds: verifiedGuestIds,
      };

      console.log("Datos a enviar para actualizar:", updateData);
      await updateReservation(updateData);
      router.push("/reservations");
      router.refresh();
    } catch (err) {
      console.error("Error updating reservation:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar la Reserva"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando información de la reserva...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudo cargar la información de la reserva.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Editar Reserva</CardTitle>
          <CardDescription>
            Actualice los detalles de la Reserva existente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Motivo de visita */}
                <FormField
                  control={form.control}
                  name="visitReasonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo de visita</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un motivo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {visitReasons.map((reason) => (
                            <SelectItem key={reason.id} value={reason.id}>
                              {reason.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Titular de la reserva */}
                <FormField
                  control={form.control}
                  name="holderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titular de la reserva</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un huésped" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {guests.map((guest) => (
                            <SelectItem key={guest.id} value={guest.id}>
                              {guest.name} {guest.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de llegada */}
                <FormField
                  control={form.control}
                  name="arrivalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de llegada</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) => {
                            if (e.target.value) {
                              field.onChange(new Date(e.target.value));
                              onDateChange();
                            }
                          }}
                          min={format(new Date(), "yyyy-MM-dd")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de salida */}
                <FormField
                  control={form.control}
                  name="departureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de salida</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) => {
                            if (e.target.value) {
                              field.onChange(new Date(e.target.value));
                              onDateChange();
                            }
                          }}
                          min={
                            form.getValues("arrivalDate")
                              ? format(
                                  form.getValues("arrivalDate"),
                                  "yyyy-MM-dd"
                                )
                              : format(new Date(), "yyyy-MM-dd")
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Número de ocupantes */}
                <FormField
                  control={form.control}
                  name="pax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de ocupantes</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Precio final */}
                <FormField
                  control={form.control}
                  name="finalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio final (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Precio final"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(
                              value === "" ? null : parseFloat(value)
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Empresa (opcional) */}
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa (opcional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            -- Sin empresa --
                          </SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Habitaciones */}
              <FormField
                control={form.control}
                name="roomIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        Habitaciones asignadas
                      </FormLabel>
                      <FormDescription>
                        Seleccione o deseleccione las habitaciones para esta
                        Reserva
                      </FormDescription>
                    </div>
                    {isLoadingRooms ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando habitaciones disponibles...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableRooms.map((room) => (
                          <FormField
                            key={room.id}
                            control={form.control}
                            name="roomIds"
                            render={({ field }) => {
                              const isAssigned =
                                reservation.assignedRooms.includes(room.id);
                              if (
                                isAssigned &&
                                !field.value?.includes(room.id)
                              ) {
                                form.setValue(
                                  "roomIds",
                                  [...field.value, room.id],
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  }
                                );
                              }

                              return (
                                <FormItem
                                  key={room.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 border p-3 rounded-md"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(room.id)}
                                      onCheckedChange={(checked) => {
                                        console.log(
                                          "Room checkbox changed:",
                                          room.id,
                                          checked
                                        );
                                        if (checked) {
                                          const newValue = [
                                            ...(field.value || []),
                                            room.id,
                                          ];
                                          console.log(
                                            "Adding room, new value:",
                                            newValue
                                          );
                                          field.onChange(newValue);
                                        } else {
                                          const newValue = field.value?.filter(
                                            (value) => value !== room.id
                                          );
                                          console.log(
                                            "Removing room, new value:",
                                            newValue
                                          );
                                          field.onChange(newValue);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    <div className="font-semibold">
                                      {room.roomNumber}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {room.type}
                                    </div>
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Huéspedes adicionales */}
              <FormField
                control={form.control}
                name="guestIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        Huéspedes adicionales
                      </FormLabel>
                      <FormDescription>
                        Seleccione o deseleccione los huéspedes para esta
                        Reserva
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {guests.map((guest) => (
                        <FormField
                          key={guest.id}
                          control={form.control}
                          name="guestIds"
                          render={({ field }) => {
                            // Verificar si este huésped debe estar seleccionado
                            const isSelected = field.value?.includes(guest.id);

                            // La auto-asignación ya ocurre al cargar los datos,
                            // por lo que no necesitamos verificar nuevamente en cada renderizado.
                            // Esto permite que los huéspedes puedan desmarcarse correctamente.

                            console.log(
                              "Huésped:",
                              guest.name,
                              guest.lastName,
                              "isSelected:",
                              isSelected
                            );

                            return (
                              <FormItem
                                key={guest.id}
                                className="flex flex-row items-start space-x-3 space-y-0 border p-3 rounded-md"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      console.log(
                                        "Guest checkbox changed:",
                                        guest.id,
                                        checked
                                      );
                                      if (checked) {
                                        const newValue = [
                                          ...(field.value || []),
                                          guest.id,
                                        ];
                                        console.log(
                                          "Adding guest, new value:",
                                          newValue
                                        );
                                        field.onChange(newValue);
                                      } else {
                                        const newValue = field.value?.filter(
                                          (value) => value !== guest.id
                                        );
                                        console.log(
                                          "Removing guest, new value:",
                                          newValue
                                        );
                                        field.onChange(newValue);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  <div className="font-semibold">
                                    {guest.name} {guest.lastName}
                                  </div>
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notas */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Añada notas adicionales sobre la Reserva"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/reservations")}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
