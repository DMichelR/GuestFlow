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
  CreateReservationDto,
  StayState,
  createReservation,
} from "@/utils/reservationService";
import { VisitReason, getAllVisitReasons } from "@/utils/visitReasonService";
import { Room, getAvailableRooms } from "@/utils/roomService";
import { Guest, getAllGuests } from "@/utils/guestService";
import { Company, getAllCompanies } from "@/utils/companyService";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema validación del formulario
const formSchema = z.object({
  visitReasonId: z.string({
    required_error: "El motivo de visita es obligatorio",
  }),
  holderId: z.string({ required_error: "El titular es obligatorio" }),
  arrivalDate: z.string({
    required_error: "La fecha de llegada es obligatoria",
  }),
  departureDate: z.string({
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

export default function CreateReservationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitReasons, setVisitReasons] = useState<VisitReason[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

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

  // Inicializar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitReasonId: "",
      holderId: "",
      arrivalDate: format(new Date(), "yyyy-MM-dd"),
      departureDate: format(
        new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
      pax: 1,
      finalPrice: null,
      notes: "",
      state: StayState.Pending,
      companyId: null,
      roomIds: [],
      guestIds: [],
    },
  });

  // Cargar datos necesarios al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [visitReasons, rooms, guests, companies] = await Promise.all([
          getAllVisitReasons(),
          getAvailableRooms(),
          getAllGuests(),
          getAllCompanies(),
        ]);

        setVisitReasons(visitReasons);
        setAvailableRooms(rooms);
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
    const formattedDate = format(date, "yyyy-MM-dd");

    if (type === "arrival") {
      form.setValue("arrivalDate", formattedDate);
      setShowArrivalCalendar(false);

      // Si la fecha de llegada es posterior a la de salida, actualizar también la fecha de salida
      const departureDate = new Date(form.getValues("departureDate"));
      if (date > departureDate) {
        // Establecer la fecha de salida un día después de la llegada
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        form.setValue("departureDate", format(nextDay, "yyyy-MM-dd"));
      }
    } else {
      form.setValue("departureDate", formattedDate);
      setShowDepartureCalendar(false);
    }
  };

  // Manejar selección de habitaciones
  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms((prev) => {
      if (prev.includes(roomId)) {
        return prev.filter((id) => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });

    form.setValue(
      "roomIds",
      selectedRooms.includes(roomId)
        ? selectedRooms.filter((id) => id !== roomId)
        : [...selectedRooms, roomId]
    );
  };

  // Manejar selección de huéspedes
  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuests((prev) => {
      if (prev.includes(guestId)) {
        return prev.filter((id) => id !== guestId);
      } else {
        return [...prev, guestId];
      }
    });

    form.setValue(
      "guestIds",
      selectedGuests.includes(guestId)
        ? selectedGuests.filter((id) => id !== guestId)
        : [...selectedGuests, guestId]
    );
  };

  // Enviar el formulario
  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      setError(null);

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
          : "Error desconocido al crear la reservación"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Crear Nueva Reservación</h1>
        <Button variant="outline" onClick={() => router.push("/reservations")}>
          Cancelar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de Reservación</CardTitle>
          <CardDescription>
            Complete el formulario para crear una nueva reservación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Motivo de visita */}
                <FormField
                  control={form.control}
                  name="visitReasonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo de Visita</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Titular */}
                <FormField
                  control={form.control}
                  name="holderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titular de la Reservación</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={loading || guests.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un titular" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {guests.map((guest) => (
                            <SelectItem key={guest.id} value={guest.id}>
                              {guest.name} {guest.lastName} - {guest.cid}
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
                      <FormLabel>Fecha de Llegada</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            onClick={() => setShowArrivalCalendar(true)}
                            readOnly
                            placeholder="Seleccionar fecha"
                          />
                        </FormControl>
                        {showArrivalCalendar && (
                          <Dialog
                            open={true}
                            onOpenChange={setShowArrivalCalendar}
                          >
                            <DialogContent className="p-0 max-w-fit">
                              {" "}
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
                      <FormLabel>Fecha de Salida</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            onClick={() => setShowDepartureCalendar(true)}
                            readOnly
                            placeholder="Seleccionar fecha"
                          />
                        </FormControl>
                        {showDepartureCalendar && (
                          <Dialog
                            open={true}
                            onOpenChange={setShowDepartureCalendar}
                          >
                            <DialogContent className="p-0 max-w-fit">
                              {" "}
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
                      <FormLabel>Cantidad de Huéspedes</FormLabel>
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
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ""}
                        disabled={loading || companies.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="a">Ninguna</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name} - RUC: {company.ruc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

              {/* Selección de habitaciones */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Habitaciones</h3>
                  <p className="text-sm text-gray-500">
                    Seleccione las habitaciones para esta reservación
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="roomIds"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {availableRooms.length === 0 ? (
                          <p className="text-sm text-gray-500 col-span-3">
                            No hay habitaciones disponibles
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
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium">
                      Habitaciones seleccionadas: {selectedRoomsDetails.length}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: $
                      {selectedRoomsDetails
                        .reduce((sum, room) => sum + room.roomTypePrice, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Selección de huéspedes */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Huéspedes</h3>
                  <p className="text-sm text-gray-500">
                    Seleccione los huéspedes que se hospedarán
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="guestIds"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        placeholder="Información adicional sobre la reservación"
                        {...field}
                        value={field.value || ""}
                        disabled={loading}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => router.push("/reservations")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creando..." : "Crear Reservación"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
