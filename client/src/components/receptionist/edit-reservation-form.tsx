"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
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
import {
  AlertCircle,
  Loader2,
  User,
  Calendar,
  Building2,
  DoorOpen,
  Users,
  FileText,
} from "lucide-react";
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Cargando información
          </h3>
          <p className="text-sm text-gray-500">
            Obteniendo los detalles de la reserva...
          </p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Error al cargar
          </h3>
          <p className="text-sm text-gray-500">
            No se pudo cargar la información de la reserva.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Editar Reserva
            </h1>
            <p className="text-gray-600">
              Actualice los detalles de la reserva existente
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Información básica */}
              <div className="pb-8 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <User className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Información básica
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Motivo de visita */}
                  <FormField
                    control={form.control}
                    name="visitReasonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Motivo de visita
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Titular de la reserva
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
                </div>
              </div>

              {/* Fechas y ocupación */}
              <div className="pb-8 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Fechas y ocupación
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Fecha de llegada */}
                  <FormField
                    control={form.control}
                    name="arrivalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Fecha de llegada
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={
                              field.value
                                ? format(field.value, "yyyy-MM-dd")
                                : ""
                            }
                            onChange={(e) => {
                              if (e.target.value) {
                                field.onChange(new Date(e.target.value));
                                onDateChange();
                              }
                            }}
                            min={format(new Date(), "yyyy-MM-dd")}
                            className="border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Fecha de salida
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={
                              field.value
                                ? format(field.value, "yyyy-MM-dd")
                                : ""
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
                            className="border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Número de ocupantes
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            className="border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Información comercial */}
              <div className="pb-8 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Información comercial
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Precio final */}
                  <FormField
                    control={form.control}
                    name="finalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Precio final (opcional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === "" ? null : parseFloat(value)
                              );
                            }}
                            className="border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Empresa (opcional)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
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
              </div>

              {/* Habitaciones */}
              <div className="pb-8 border-b border-gray-200">
                <FormField
                  control={form.control}
                  name="roomIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <DoorOpen className="h-5 w-5 text-orange-500" />
                          <FormLabel className="text-lg font-semibold text-gray-900">
                            Habitaciones asignadas
                          </FormLabel>
                        </div>
                        <FormDescription className="text-gray-600">
                          Seleccione las habitaciones para esta reserva
                        </FormDescription>
                      </div>
                      {isLoadingRooms ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                            <span className="text-gray-600">
                              Cargando habitaciones disponibles...
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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

                                const isSelected = field.value?.includes(
                                  room.id
                                );
                                return (
                                  <FormItem
                                    key={room.id}
                                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-orange-500 bg-orange-50"
                                        : "border-gray-200 hover:border-orange-300"
                                    }`}
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            const newValue = [
                                              ...(field.value || []),
                                              room.id,
                                            ];
                                            field.onChange(newValue);
                                          } else {
                                            const newValue =
                                              field.value?.filter(
                                                (value) => value !== room.id
                                              );
                                            field.onChange(newValue);
                                          }
                                        }}
                                        className="absolute top-2 right-2"
                                      />
                                    </FormControl>
                                    <div className="text-center pt-2">
                                      <FormLabel className="cursor-pointer">
                                        <div className="font-semibold text-lg text-gray-900 mb-1">
                                          {room.roomNumber}
                                        </div>
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                          {room.type}
                                        </div>
                                      </FormLabel>
                                    </div>
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
              </div>

              {/* Huéspedes adicionales */}
              <div className="pb-8 border-b border-gray-200">
                <FormField
                  control={form.control}
                  name="guestIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-cyan-500" />
                          <FormLabel className="text-lg font-semibold text-gray-900">
                            Huéspedes adicionales
                          </FormLabel>
                        </div>
                        <FormDescription className="text-gray-600">
                          Seleccione los huéspedes para esta reserva
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {guests.map((guest) => (
                          <FormField
                            key={guest.id}
                            control={form.control}
                            name="guestIds"
                            render={({ field }) => {
                              const isSelected = field.value?.includes(
                                guest.id
                              );

                              return (
                                <FormItem
                                  key={guest.id}
                                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-cyan-500 bg-cyan-50"
                                      : "border-gray-200 hover:border-cyan-300"
                                  }`}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          const newValue = [
                                            ...(field.value || []),
                                            guest.id,
                                          ];
                                          field.onChange(newValue);
                                        } else {
                                          const newValue = field.value?.filter(
                                            (value) => value !== guest.id
                                          );
                                          field.onChange(newValue);
                                        }
                                      }}
                                      className="absolute top-2 right-2"
                                    />
                                  </FormControl>
                                  <div className="text-center pt-2">
                                    <FormLabel className="cursor-pointer">
                                      <div className="font-medium text-gray-900 mb-1">
                                        {guest.name} {guest.lastName}
                                      </div>
                                    </FormLabel>
                                  </div>
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
              </div>

              {/* Notas */}
              <div className="pb-8">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5 text-yellow-500" />
                          <FormLabel className="text-lg font-semibold text-gray-900">
                            Notas adicionales
                          </FormLabel>
                        </div>
                        <FormDescription className="text-gray-600">
                          Información adicional o comentarios especiales sobre
                          la reserva
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Añada notas adicionales sobre la reserva..."
                          {...field}
                          value={field.value || ""}
                          className="min-h-[100px] border-gray-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-4 pt-8 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/reservations")}
                  disabled={isSubmitting}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 bg-blue-500 hover:bg-blue-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
