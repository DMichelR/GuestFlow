"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  getAllServices,
  createServiceTicket,
  Service,
} from "@/utils/serviceService";
import { getAllReservations, Reservation } from "@/utils/reservationService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Create form schema
const formSchema = z.object({
  serviceId: z.string().min(1, "Debe seleccionar un servicio"),
  reservationId: z.string().min(1, "Debe seleccionar una Reserva"),
  price: z
    .string()
    .min(1, "El precio es requerido")
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "El precio debe ser un número válido",
    }),
  notes: z.string().optional(),
});

function CreateServiceTicketForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get("serviceId");
  const reservationId = searchParams.get("reservationId");

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: serviceId || "",
      reservationId: reservationId || "",
      price: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesData, reservationsData] = await Promise.all([
          getAllServices(),
          getAllReservations(),
        ]);
        setServices(servicesData);
        setReservations(reservationsData);
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
  }, []);

  // Update form values when serviceId or reservationId is available from URL params
  useEffect(() => {
    if (serviceId) {
      form.setValue("serviceId", serviceId);
    }
    if (reservationId) {
      form.setValue("reservationId", reservationId);
    }
  }, [serviceId, reservationId, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await createServiceTicket({
        serviceId: data.serviceId,
        stayId: data.reservationId,
        price: parseFloat(data.price),
        notes: data.notes || null,
      });

      // Redirect back to reservations after successful submission
      router.push("/reservations");
    } catch (err) {
      console.error("Error creating service ticket:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al crear el ticket de servicio"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Crear Boleta de Servicio</h1>
        <div className="flex justify-center items-center h-64">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Crear Boleta de Servicio</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <p>Error: {error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información de la Boleta</CardTitle>
          <CardDescription>
            Ingrese los detalles para crear una nueva boleta de servicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servicio</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Seleccione el servicio que desea agregar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reservationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reserva</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una Reserva" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reservations.map((reservation) => (
                          <SelectItem
                            key={reservation.id}
                            value={reservation.id}
                          >
                            {reservation.holderName} - Llegada:{" "}
                            {new Date(
                              reservation.arrivalDate
                            ).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Seleccione la Reserva a la que se asignará este servicio.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        {...field}
                        type="number"
                        step="0.01"
                      />
                    </FormControl>
                    <FormDescription>
                      Ingrese el precio del servicio.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalles adicionales o comentarios..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ingrese cualquier detalle adicional sobre el servicio
                      (opcional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Boleta"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateServiceTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-8">Crear Boleta de Servicio</h1>
          <div className="flex justify-center items-center h-64">
            <p>Cargando...</p>
          </div>
        </div>
      }
    >
      <CreateServiceTicketForm />
    </Suspense>
  );
}
