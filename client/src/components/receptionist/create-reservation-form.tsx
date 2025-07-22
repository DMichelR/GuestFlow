"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { CreateGuestModal } from "@/components/receptionist/create-guest-modal";

// Schema de validación del formulario
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
  const [error, setError] = useState<string | null>(null);
  const [visitReasons, setVisitReasons] = useState<VisitReason[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Estados para diálogos
  const [showCreateVisitReasonDialog, setShowCreateVisitReasonDialog] =
    useState(false);
  const [newVisitReasonName, setNewVisitReasonName] = useState("");
  const [creatingVisitReason, setCreatingVisitReason] = useState(false);
  const [showCreateCompanyDialog, setShowCreateCompanyDialog] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [showCreateGuestDialog, setShowCreateGuestDialog] = useState(false);

  // Estados para calendarios
  const [showArrivalCalendar, setShowArrivalCalendar] = useState(false);
  const [showDepartureCalendar, setShowDepartureCalendar] = useState(false);

  // Estados para selección múltiple
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
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

  const arrivalDateRef = form.watch("arrivalDate");
  const departureDateRef = form.watch("departureDate");

  // Efecto para actualizar habitaciones disponibles cuando cambien las fechas
  useEffect(() => {
    if (arrivalDateRef && departureDateRef) {
      const arrival = new Date(arrivalDateRef);
      const departure = new Date(departureDateRef);

      if (departure <= arrival) {
        return;
      }

      setSelectedRooms([]);
      form.setValue("roomIds", []);
      setLoadingRooms(true);

      getAvailableRooms(token, arrivalDateRef, departureDateRef)
        .then((rooms) => {
          setAvailableRooms(rooms);
        })
        .catch((error) => {
          console.error("Error al cargar habitaciones disponibles:", error);
          setError("Error al cargar habitaciones disponibles");
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
        setError("Error al cargar los datos necesarios");
      }
    };

    fetchData();
  }, []);

  // Función para manejar la selección de fechas
  const handleDateSelect = (date: Date, type: "arrival" | "departure") => {
    if (type === "arrival") {
      form.setValue("arrivalDate", date);
      setShowArrivalCalendar(false);

      const departureDate = new Date(form.getValues("departureDate"));
      if (date >= departureDate) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        form.setValue("departureDate", nextDay);
      }
    } else {
      const arrivalDate = new Date(form.getValues("arrivalDate"));

      if (date <= arrivalDate) {
        const nextDay = new Date(arrivalDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setError("La fecha de salida debe ser posterior a la de llegada");
        form.setValue("departureDate", nextDay);
      } else {
        form.setValue("departureDate", date);
      }

      setShowDepartureCalendar(false);
    }
  };

  // Manejar selección de habitaciones
  const toggleRoomSelection = (roomId: string) => {
    const newSelectedRooms = selectedRooms.includes(roomId)
      ? selectedRooms.filter((id) => id !== roomId)
      : [...selectedRooms, roomId];

    setSelectedRooms(newSelectedRooms);
    form.setValue("roomIds", newSelectedRooms);
  };

  // Manejar selección de huéspedes
  const toggleGuestSelection = (guestId: string) => {
    const newSelectedGuests = selectedGuests.includes(guestId)
      ? selectedGuests.filter((id) => id !== guestId)
      : [...selectedGuests, guestId];

    setSelectedGuests(newSelectedGuests);
    form.setValue("guestIds", newSelectedGuests);

    // Auto-seleccionar como titular si es el primer huésped
    if (newSelectedGuests.length === 1 && newSelectedGuests.includes(guestId)) {
      form.setValue("holderId", guestId);
    }
  };

  // Crear nuevo motivo de visita
  const handleCreateVisitReason = async () => {
    if (!newVisitReasonName.trim()) return;

    setCreatingVisitReason(true);
    try {
      const newReason = await createVisitReason(newVisitReasonName);
      setVisitReasons([...visitReasons, newReason]);
      form.setValue("visitReasonId", newReason.id);
      setShowCreateVisitReasonDialog(false);
      setNewVisitReasonName("");
    } catch (err) {
      console.error("Error creating visit reason:", err);
      setError("Error al crear el motivo de visita");
    } finally {
      setCreatingVisitReason(false);
    }
  };

  // Crear nueva empresa
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;

    setCreatingCompany(true);
    try {
      const newCompany = await createCompany({ name: newCompanyName });
      setCompanies([...companies, newCompany]);
      form.setValue("companyId", newCompany.id);
      setShowCreateCompanyDialog(false);
      setNewCompanyName("");
    } catch (err) {
      console.error("Error creating company:", err);
      setError("Error al crear la empresa");
    } finally {
      setCreatingCompany(false);
    }
  };

  // Manejar creación exitosa de huésped
  const handleGuestCreated = (newGuest: unknown) => {
    const guest = newGuest as Guest;
    setGuests([...guests, guest]);
    toggleGuestSelection(guest.id);
    setShowCreateGuestDialog(false);
  };

  // Enviar el formulario
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);

    try {
      const reservationData: CreateReservationDto = {
        visitReasonId: values.visitReasonId,
        holderId: values.holderId,
        arrivalDate: values.arrivalDate.toISOString(),
        departureDate: values.departureDate.toISOString(),
        pax: values.pax,
        finalPrice: values.finalPrice ?? undefined,
        notes: values.notes ?? undefined,
        state: values.state || StayState.Pending,
        companyId:
          values.companyId === "none" || !values.companyId
            ? undefined
            : values.companyId,
        roomIds: values.roomIds,
        guestIds: values.guestIds,
      };

      await createReservation(reservationData);
      router.push("/reservations");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al crear la reservación"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Nueva Reservación
            </h1>
            <p className="text-gray-600">
              Complete los datos para crear una nueva reservación
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-red-500 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
                  <svg
                    className="h-5 w-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Motivo de visita *
                        </FormLabel>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={loading || visitReasons.length === 0}
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
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            onClick={() => setShowCreateVisitReasonDialog(true)}
                            title="Crear nuevo motivo de visita"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Empresa */}
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Empresa (Opcional)
                        </FormLabel>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Select
                              onValueChange={(value) =>
                                field.onChange(value === "none" ? null : value)
                              }
                              value={field.value || "none"}
                              disabled={loading}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                  <SelectValue placeholder="Seleccione una empresa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">
                                  Sin empresa
                                </SelectItem>
                                {companies.map((company) => (
                                  <SelectItem
                                    key={company.id}
                                    value={company.id}
                                  >
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
                            className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            onClick={() => setShowCreateCompanyDialog(true)}
                            title="Crear nueva empresa"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
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
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Fecha de llegada *
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
                              className="cursor-pointer border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </FormControl>
                          {showArrivalCalendar && (
                            <Dialog
                              open={true}
                              onOpenChange={setShowArrivalCalendar}
                            >
                              <DialogContent className="p-0 max-w-fit">
                                <DialogTitle>
                                  Seleccionar Fecha de Llegada
                                </DialogTitle>
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Fecha de salida *
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
                              className="cursor-pointer border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </FormControl>
                          {showDepartureCalendar && (
                            <Dialog
                              open={true}
                              onOpenChange={setShowDepartureCalendar}
                            >
                              <DialogContent className="p-0 max-w-fit">
                                <DialogTitle>
                                  Seleccionar Fecha de Salida
                                </DialogTitle>
                                <DialogDescription>
                                  Seleccione la fecha de salida
                                </DialogDescription>
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
                                    arrivalDateRef
                                      ? new Date(arrivalDateRef)
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

                  {/* Número de huéspedes */}
                  <FormField
                    control={form.control}
                    name="pax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Número de huéspedes *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            min={1}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value, 10) || 1)
                            }
                            disabled={loading}
                            className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Habitaciones disponibles */}
              <div className="pb-8 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <svg
                    className="h-5 w-5 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 002-2h6l2 2h6a2 2 0 012 2v1"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Habitaciones disponibles
                    {selectedRooms.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-purple-600">
                        ({selectedRooms.length} seleccionada
                        {selectedRooms.length > 1 ? "s" : ""})
                      </span>
                    )}
                  </h3>
                </div>

                {loadingRooms ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">
                        Cargando habitaciones...
                      </span>
                    </div>
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="h-12 w-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m3 0h1a1 1 0 011 1v1m0 0v1h1a1 1 0 001 1H9a1 1 0 01-1-1v-1m0 0V5a1 1 0 011-1h1"
                      />
                    </svg>
                    <p className="text-gray-600 font-medium">
                      No hay habitaciones disponibles
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Para las fechas seleccionadas
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          selectedRooms.includes(room.id)
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                        }`}
                        onClick={() => toggleRoomSelection(room.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            Habitación {room.number}
                          </h4>
                          <div
                            className={`w-4 h-4 rounded border-2 ${
                              selectedRooms.includes(room.id)
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedRooms.includes(room.id) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {room.roomTypeName}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Capacidad: {room.capacity || 2}
                          </span>
                          <span className="text-sm font-semibold text-blue-600">
                            ${room.roomTypePrice?.toFixed(2) || "0.00"}/noche
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="roomIds"
                  render={() => (
                    <FormItem className="hidden">
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Huéspedes */}
              <div className="pb-8 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <svg
                    className="h-5 w-5 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Huéspedes
                    {selectedGuests.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-orange-600">
                        ({selectedGuests.length} seleccionado
                        {selectedGuests.length > 1 ? "s" : ""})
                      </span>
                    )}
                  </h3>
                </div>

                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    onClick={() => setShowCreateGuestDialog(true)}
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Crear nuevo huésped
                  </Button>
                </div>

                {guests.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="h-12 w-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="text-gray-600 font-medium">
                      No hay huéspedes registrados
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Cree un nuevo huésped para continuar
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {guests.map((guest) => (
                      <div
                        key={guest.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          selectedGuests.includes(guest.id)
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm"
                        }`}
                        onClick={() => toggleGuestSelection(guest.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {guest.name} {guest.lastName}
                          </h4>
                          <div
                            className={`w-4 h-4 rounded border-2 ${
                              selectedGuests.includes(guest.id)
                                ? "bg-orange-500 border-orange-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedGuests.includes(guest.id) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {guest.email}
                        </p>
                        <p className="text-sm text-gray-600">{guest.phone}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          CID: {guest.cid}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Titular */}
                {selectedGuests.length > 0 && (
                  <div className="border-t pt-4">
                    <FormField
                      control={form.control}
                      name="holderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Titular de la reservación *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={loading || selectedGuests.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                <SelectValue placeholder="Seleccione el titular" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {guests
                                .filter((guest) =>
                                  selectedGuests.includes(guest.id)
                                )
                                .map((guest) => (
                                  <SelectItem key={guest.id} value={guest.id}>
                                    {guest.name} {guest.lastName} - {guest.cid}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Solo puede seleccionar entre los huéspedes elegidos
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="guestIds"
                  render={() => (
                    <FormItem className="hidden">
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Información adicional */}
              <div className="pb-8">
                <div className="flex items-center gap-2 mb-6">
                  <svg
                    className="h-5 w-5 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Información adicional
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Precio final */}
                  <FormField
                    control={form.control}
                    name="finalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Precio final (Opcional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                            value={field.value || ""}
                            disabled={loading}
                            className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormDescription>
                          Deje vacío para calcular automáticamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Estado de la reservación */}
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Estado de la reservación
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value, 10))
                          }
                          value={field.value?.toString()}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
                            <SelectItem value={StayState.Canceled.toString()}>
                              Cancelada
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notas */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Notas (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional sobre la reservación..."
                          className="resize-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          rows={3}
                          {...field}
                          value={field.value || ""}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/reservations")}
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[140px] bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creando...
                    </div>
                  ) : (
                    "Crear Reservación"
                  )}
                </Button>
              </div>
            </form>
          </Form>

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
                  <label
                    htmlFor="visitReasonName"
                    className="text-sm font-medium"
                  >
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
                    onClick={() => {
                      setShowCreateVisitReasonDialog(false);
                      setNewVisitReasonName("");
                    }}
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
                    onClick={() => {
                      setShowCreateCompanyDialog(false);
                      setNewCompanyName("");
                    }}
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
      </div>
    </div>
  );
}
