"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

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
  CreateReservationDto,
  StayState,
  createReservation,
} from "@/utils/reservationService";
import { Room, getAvailableRooms } from "@/utils/roomService";
import { Guest, getAllGuests } from "@/utils/guestService";
import {
  Company,
  getAllCompanies,
  createCompany,
  CreateCompanyDto,
} from "@/utils/companyService";
import {
  VisitReason,
  getAllVisitReasons,
  createVisitReason,
} from "@/utils/visitReasonService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
// Importar el componente de creación de huéspedes
import { CreateGuestModal } from "@/components/receptionist/create-guest-modal";

// Schema validación del formulario
const formSchema = z.object({
  visitReasonId: z.string({
    required_error: "El motivo de visita es obligatorio",
  }),
  holderId: z.string({ required_error: "El titular es obligatorio" }),
  arrivalDate: z.date({
    required_error: "La fecha de llegada es obligatoria",
  }),
  departureDate: z.date({
    required_error: "La fecha de salida es obligatoria",
  }),
  pax: z.number().min(1, { message: "Debe haber al menos un huésped" }),
  finalPrice: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  state: z.nativeEnum(StayState).optional(),
  companyId: z.string().optional().nullable(),
  roomIds: z
    .array(z.string())
    .min(1, { message: "Debe seleccionar al menos una habitación" }),
  guestIds: z
    .array(z.string())
    .min(1, { message: "Debe seleccionar al menos un huésped" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateReservationForm({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [visitReasons, setVisitReasons] = useState<VisitReason[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Estado para el diálogo de crear motivo de visita
  const [showCreateVisitReasonDialog, setShowCreateVisitReasonDialog] =
    useState(false);
  const [newVisitReasonName, setNewVisitReasonName] = useState("");
  const [creatingVisitReason, setCreatingVisitReason] = useState(false);

  // Estados para el diálogo de crear empresa
  const [showCreateCompanyDialog, setShowCreateCompanyDialog] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Estado para el diálogo de crear huésped
  const [showCreateGuestDialog, setShowCreateGuestDialog] = useState(false);

  // Estados para calendarios
  const [showArrivalCalendar, setShowArrivalCalendar] = useState(false);
  const [showDepartureCalendar, setShowDepartureCalendar] = useState(false);

  // Estados para selección múltiple
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);

  // Para mostrar datos adicionales
  const [selectedRoomsDetails, setSelectedRoomsDetails] = useState<Room[]>([]);
  const [selectedGuestsDetails, setSelectedGuestsDetails] = useState<Guest[]>(
    []
  );

  // Estado para indicar cuando se están cargando las habitaciones
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

  // Inicializar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitReasonId: "",
      holderId: "",
      arrivalDate: new Date(),
      departureDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      pax: 1,
      finalPrice: null,
      notes: "",
      state: StayState.Pending,
      companyId: null,
      roomIds: [],
      guestIds: [],
    },
  });

  // Crear una referencia para las fechas actuales
  const arrivalDateRef = form.watch("arrivalDate");
  const departureDateRef = form.watch("departureDate");

  // Efecto para actualizar habitaciones disponibles cuando cambien las fechas
  useEffect(() => {
    console.log(
      "Fetching available rooms for dates:",
      arrivalDateRef,
      departureDateRef
    );

    if (arrivalDateRef && departureDateRef) {
      // Validar fechas antes de buscar habitaciones
      const arrival = new Date(arrivalDateRef);
      const departure = new Date(departureDateRef);

      if (departure <= arrival) {
        console.log("Fechas inválidas, no se buscarán habitaciones");
        return;
      }

      // Limpiar habitaciones seleccionadas cuando cambien las fechas
      setSelectedRooms([]);
      form.setValue("roomIds", []);

      // Mostrar indicador de carga
      setLoadingRooms(true);

      getAvailableRooms(token, arrivalDateRef, departureDateRef)
        .then((rooms) => {
          setAvailableRooms(rooms);
          if (rooms.length === 0) {
            console.log(
              "No hay habitaciones disponibles para las fechas seleccionadas"
            );
          }
        })
        .catch((error) => {
          console.error("Error al cargar habitaciones disponibles:", error);
          setError(
            error instanceof Error
              ? error.message
              : "Error al cargar habitaciones disponibles"
          );
          setAvailableRooms([]);
        })
        .finally(() => {
          setLoadingRooms(false);
        });
    }
  }, [arrivalDateRef, departureDateRef, token, form]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [visitReasons, guests, companies] = await Promise.all([
          getAllVisitReasons(),
          getAllGuests(),
          getAllCompanies(),
        ]);

        setVisitReasons(visitReasons);
        setGuests(guests);
        setCompanies(companies);
      } catch (err) {
        console.error("Error fetching form data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar los datos necesarios"
        );
      }
    };

    fetchData();
  }, []);

  // Mantener actualizados los detalles de selección
  useEffect(() => {
    setSelectedRoomsDetails(
      availableRooms.filter((room) => selectedRooms.includes(room.id))
    );
  }, [selectedRooms, availableRooms]);

  useEffect(() => {
    setSelectedGuestsDetails(
      guests.filter((guest) => selectedGuests.includes(guest.id))
    );
  }, [selectedGuests, guests]);

  // Función para manejar la selección de fechas
  const handleDateSelect = (date: Date, type: "arrival" | "departure") => {
    if (type === "arrival") {
      // Actualizar fecha de llegada
      form.setValue("arrivalDate", date);
      setShowArrivalCalendar(false);

      // Si la fecha de llegada es posterior o igual a la de salida,
      // actualizar automáticamente la fecha de salida para ser el día siguiente
      const departureDate = new Date(form.getValues("departureDate"));
      if (date >= departureDate) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        form.setValue("departureDate", nextDay);
      }
    } else {
      // Actualizar fecha de salida, asegurándose de que sea posterior a la llegada
      const arrivalDate = new Date(form.getValues("arrivalDate"));

      if (date <= arrivalDate) {
        // Si la fecha seleccionada no es válida, usar el día siguiente a la llegada
        const nextDay = new Date(arrivalDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Notificar al usuario del ajuste automático
        setError("La fecha de salida debe ser posterior a la de llegada");

        form.setValue("departureDate", nextDay);
      } else {
        // Fecha válida, actualizar normalmente
        form.setValue("departureDate", date);
      }

      setShowDepartureCalendar(false);
    }

    // No necesitamos hacer nada más aquí; las habitaciones se actualizarán
    // automáticamente gracias al efecto que observa los cambios en las fechas
  };

  // Manejar selección de habitaciones
  const toggleRoomSelection = (roomId: string) => {
    // Actualizar el estado local primero
    const newSelectedRooms = selectedRooms.includes(roomId)
      ? selectedRooms.filter((id) => id !== roomId)
      : [...selectedRooms, roomId];

    // Luego actualizar el estado y el formulario con el mismo valor
    setSelectedRooms(newSelectedRooms);
    form.setValue("roomIds", newSelectedRooms);
  }; // Manejar selección de huéspedes
  const toggleGuestSelection = (guestId: string) => {
    const isAlreadySelected = selectedGuests.includes(guestId);

    // Actualizar la lista de huéspedes seleccionados
    setSelectedGuests((prev) => {
      if (isAlreadySelected) {
        return prev.filter((id) => id !== guestId);
      } else {
        return [...prev, guestId];
      }
    });

    // Actualizar el campo guestIds del formulario
    const newGuestIds = isAlreadySelected
      ? selectedGuests.filter((id) => id !== guestId)
      : [...selectedGuests, guestId];

    form.setValue("guestIds", newGuestIds);

    // Si estamos eliminando el titular actual, limpiamos el campo de titular
    if (isAlreadySelected && form.getValues("holderId") === guestId) {
      form.setValue("holderId", "");
    }

    // Si es el primer huésped seleccionado, lo establecemos automáticamente como titular
    if (newGuestIds.length === 1 && !isAlreadySelected) {
      form.setValue("holderId", guestId);
    }

    // Si estamos eliminando el titular actual, limpiamos el campo de titular
    if (isAlreadySelected && form.getValues("holderId") === guestId) {
      form.setValue("holderId", "");
    }

    // Si es el primer huésped seleccionado, lo establecemos automáticamente como titular
    if (newGuestIds.length === 1 && !isAlreadySelected) {
      form.setValue("holderId", guestId);
    }
  };

  // Función para crear un nuevo motivo de visita
  const handleCreateVisitReason = async () => {
    if (!newVisitReasonName.trim()) {
      return;
    }

    try {
      setCreatingVisitReason(true);
      const newVisitReason = await createVisitReason(newVisitReasonName.trim());

      // Actualizar la lista de motivos
      setVisitReasons((prev) => [...prev, newVisitReason]);

      // Seleccionar el nuevo motivo
      form.setValue("visitReasonId", newVisitReason.id);

      // Cerrar el diálogo y limpiar
      setShowCreateVisitReasonDialog(false);
      setNewVisitReasonName("");
    } catch (error) {
      console.error("Error al crear motivo de visita:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error desconocido al crear motivo de visita"
      );
    } finally {
      setCreatingVisitReason(false);
    }
  };

  // Función para crear una nueva empresa
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      return;
    }

    try {
      setCreatingCompany(true);
      const newCompany: CreateCompanyDto = {
        name: newCompanyName.trim(),
      };
      const createdCompany = await createCompany(newCompany);

      // Actualizar la lista de empresas
      setCompanies((prev) => [...prev, createdCompany]);

      // Seleccionar la nueva empresa
      form.setValue("companyId", createdCompany.id);

      // Cerrar el diálogo y limpiar
      setShowCreateCompanyDialog(false);
      setNewCompanyName("");
    } catch (error) {
      console.error("Error al crear empresa:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error desconocido al crear empresa"
      );
    } finally {
      setCreatingCompany(false);
    }
  };

  // Función para manejar un nuevo huésped creado
  const handleGuestCreated = (newGuest: Guest) => {
    // Actualizar la lista de huéspedes
    setGuests((prev) => [...prev, newGuest]);

    // Seleccionar automáticamente el nuevo huésped
    toggleGuestSelection(newGuest.id);
  };

  // Enviar el formulario
  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar que se haya seleccionado un titular y que esté entre los huéspedes seleccionados
      if (!data.holderId) {
        form.setError("holderId", {
          type: "manual",
          message: "Debe seleccionar un titular para la Reserva",
        });
        setLoading(false);
        return;
      }

      if (!selectedGuests.includes(data.holderId)) {
        form.setError("holderId", {
          type: "manual",
          message: "El titular debe ser uno de los huéspedes seleccionados",
        });
        setLoading(false);
        return;
      }

      // Asegurarse de que roomIds y guestIds estén actualizados
      const formData: CreateReservationDto = {
        ...data,
        roomIds: selectedRooms,
        guestIds: selectedGuests,
      };

      await createReservation(formData);
      router.push("/reservations");
    } catch (err) {
      console.error("Error creating reservation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al crear la Reserva"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Nueva Reserva
            </h1>
            <p className="text-gray-600">
              Complete los detalles para crear una nueva reserva
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
              <div className="flex">
                <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
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
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
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
                      <FormLabel className="flex gap-1">
                        Motivo de Visita <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={loading || visitReasons.length === 0}
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
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setShowCreateVisitReasonDialog(true)}
                          title="Crear nuevo motivo de visita"
                        >
                          +
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Fechas y ocupación */}
            <div className="pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012 0v4m0 0V3a1 1 0 012 0v4m0 0h4l-2 2m0 0l2 2m-2-2H8m8 4V9.586a1 1 0 00-.293-.707L13 6.172A1 1 0 0012.586 6H6a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1z" />
                </svg>
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
                      <FormLabel className="flex gap-1">
                        Fecha de Llegada <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            onClick={() => setShowArrivalCalendar(true)}
                            readOnly
                            placeholder="Seleccionar fecha"
                            value={
                              field.value
                                ? format(new Date(field.value), "dd/MM/yyyy")
                                : ""
                            }
                          />
                        </FormControl>
                        {showArrivalCalendar && (
                          <Dialog
                            open={true}
                            onOpenChange={setShowArrivalCalendar}
                          >
                            <DialogContent className="p-0 max-w-fit">
                              <DialogTitle>Seleccione su Fecha</DialogTitle>
                              <DialogDescription>
                                Seleccione la fecha de llegada
                              </DialogDescription>
                              <Calendar
                                date={
                                  field.value
                                    ? new Date(field.value)
                                    : new Date()
                                }
                                locale={es}
                                onChange={(date: Date) =>
                                  handleDateSelect(date, "arrival")
                                }
                                minDate={new Date()}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
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
                      <FormLabel className="flex gap-1">
                        Fecha de Salida <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            onClick={() => setShowDepartureCalendar(true)}
                            readOnly
                            placeholder="Seleccionar fecha"
                            value={
                              field.value
                                ? format(new Date(field.value), "dd/MM/yyyy")
                                : ""
                            }
                          />
                        </FormControl>
                        {showDepartureCalendar && (
                          <Dialog
                            open={true}
                            onOpenChange={setShowDepartureCalendar}
                          >
                            <DialogContent className="p-0 max-w-fit">
                              <DialogTitle>Seleccione su Fecha</DialogTitle>
                              <DialogDescription>
                                Seleccione la fecha de partida
                              </DialogDescription>{" "}
                              <Calendar
                                date={
                                  field.value
                                    ? new Date(field.value)
                                    : new Date()
                                }
                                locale={es}
                                onChange={(date: Date) =>
                                  handleDateSelect(date, "departure")
                                }
                                minDate={
                                  form.getValues("arrivalDate")
                                    ? new Date(form.getValues("arrivalDate"))
                                    : new Date()
                                }
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cantidad de huéspedes */}
                <FormField
                  control={form.control}
                  name="pax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex gap-1">
                        Cantidad de Huéspedes{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                          min={1}
                          disabled={loading}
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
                <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
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
                      <FormLabel>Precio Final (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          placeholder="0.00"
                          disabled={loading}
                          step="0.01"
                          value={field.value === null ? "" : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Si no se especifica, se calculará automáticamente según
                        las habitaciones
                      </FormDescription>
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
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            disabled={loading || companies.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una empresa (opcional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Ninguna</SelectItem>{" "}
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setShowCreateCompanyDialog(true)}
                          title="Crear nueva empresa"
                        >
                          +
                        </Button>
                      </div>
                      <FormDescription>Este campo es opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Estado de la reserva */}
            <div className="pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Estado de la reserva
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6">

                {/* Estado */}
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        defaultValue={
                          field.value?.toString() ||
                          StayState.Pending.toString()
                        }
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={StayState.Pending.toString()}>
                            Pendiente
                          </SelectItem>
                          <SelectItem value={StayState.Active.toString()}>
                            Activa
                          </SelectItem>
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
              <div className="flex items-center gap-2 mb-6">
                <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Habitaciones asignadas
                </h3>
              </div>
              {loadingRooms ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600">
                      Cargando habitaciones disponibles...
                    </span>
                  </div>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="roomIds"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {loadingRooms ? (
                          <p className="text-sm text-blue-500 col-span-3 text-center py-4">
                            Cargando habitaciones disponibles...
                          </p>
                        ) : availableRooms.length === 0 ? (
                          <p className="text-sm text-gray-500 col-span-3">
                            No hay habitaciones disponibles para las fechas
                            seleccionadas
                          </p>
                        ) : (
                          availableRooms.map((room) => (
                            <div
                              key={room.id}
                              className={`p-3 rounded-md border cursor-pointer ${
                                selectedRooms.includes(room.id)
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200"
                              }`}
                              onClick={() => toggleRoomSelection(room.id)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    Habitación {room.number}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {room.roomTypeName}
                                  </p>
                                </div>
                                <p className="text-sm font-bold">
                                  ${room.roomTypePrice.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedRoomsDetails.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Habitaciones seleccionadas: {selectedRoomsDetails.length}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total estimado: $
                      {selectedRoomsDetails
                        .reduce((sum, room) => sum + room.roomTypePrice, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Huéspedes */}
            <div className="pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <svg className="h-5 w-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Huéspedes de la reserva
                </h3>
              </div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  Seleccione los huéspedes que se hospedarán
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateGuestDialog(true)}
                  className="border-gray-300 hover:border-cyan-500 hover:text-cyan-600"
                >
                  + Nuevo Huésped
                </Button>
              </div>

              <FormField
                control={form.control}
                name="guestIds"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {guests.length === 0 ? (
                          <p className="text-sm text-gray-500 col-span-3">
                            No hay huéspedes registrados
                          </p>
                        ) : (
                          guests.map((guest) => (
                            <div
                              key={guest.id}
                              className={`p-3 rounded-md border cursor-pointer ${
                                selectedGuests.includes(guest.id)
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200"
                              }`}
                              onClick={() => toggleGuestSelection(guest.id)}
                            >
                              <p className="font-medium">
                                {guest.name} {guest.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                CID: {guest.cid} • {guest.email}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedGuestsDetails.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium">
                      Huéspedes seleccionados: {selectedGuestsDetails.length}
                    </p>
                  </div>
                )}

                {/* Titular de la Reserva (después de seleccionar huéspedes) */}
                {selectedGuestsDetails.length > 0 && (
                  <FormField
                    control={form.control}
                    name="holderId"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel className="flex gap-1">
                          Titular de la Reserva{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={
                            loading || selectedGuestsDetails.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un titular" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedGuestsDetails.map((guest) => (
                              <SelectItem key={guest.id} value={guest.id}>
                                {guest.name} {guest.lastName} - {guest.cid}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          El titular debe ser uno de los huéspedes seleccionados
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Notas */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Información adicional sobre la Reserva (opcional)"
                        {...field}
                        value={field.value || ""}
                        disabled={loading}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Puede añadir cualquier información relevante o dejar este
                      campo en blanco
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-500">
                  <span className="text-red-500">*</span> Campos obligatorios
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => router.push("/reservations")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/reservations")}
                    disabled={loading}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-6 bg-blue-500 hover:bg-blue-600"
                  >
                    {loading ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando...
                      </>
                    ) : (
                      "Crear Reserva"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Diálogos */}
      {/* Diálogo para crear nuevo motivo de visita */}
      <Dialog
        open={showCreateVisitReasonDialog}
        onOpenChange={setShowCreateVisitReasonDialog}
      >
        <DialogContent>
          <DialogTitle>Crear Nuevo Motivo de Visita</DialogTitle>
          <DialogDescription>
            Ingrese el nombre para el nuevo motivo de visita.
          </DialogDescription>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="visitReasonName" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="visitReasonName"
                placeholder="Nombre del motivo de visita"
                value={newVisitReasonName}
                onChange={(e) => setNewVisitReasonName(e.target.value)}
                disabled={creatingVisitReason}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateVisitReasonDialog(false)}
                disabled={creatingVisitReason}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateVisitReason}
                disabled={!newVisitReasonName.trim() || creatingVisitReason}
              >
                {creatingVisitReason ? "Creando..." : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear nueva empresa */}
      <Dialog
        open={showCreateCompanyDialog}
        onOpenChange={setShowCreateCompanyDialog}
      >
        <DialogContent>
          <DialogTitle>Crear Nueva Empresa</DialogTitle>
          <DialogDescription>
            Ingrese el nombre para la nueva empresa.
          </DialogDescription>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="companyName" className="text-sm font-medium">
                Nombre de la Empresa
              </label>
              <Input
                id="companyName"
                placeholder="Nombre de la empresa"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                disabled={creatingCompany}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateCompanyDialog(false)}
                disabled={creatingCompany}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateCompany}
                disabled={!newCompanyName.trim() || creatingCompany}
              >
                {creatingCompany ? "Creando..." : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear nuevo huésped */}
      <CreateGuestModal
        isOpen={showCreateGuestDialog}
        onClose={() => setShowCreateGuestDialog(false)}
        onSuccess={handleGuestCreated}
      />
    </div>
  );
}
