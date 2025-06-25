"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createServiceTicket } from "@/utils/serviceService";
import { Reservation, StayState } from "@/utils/reservationService";

interface CreateServiceTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  reservations: Reservation[];
  onSuccess: () => void;
}

const formSchema = z.object({
  reservationId: z.string().min(1, "Debe seleccionar una Reserva"),
  price: z
    .string()
    .min(1, "El precio es requerido")
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "El precio debe ser un número válido",
    }),
  notes: z.string().optional(),
});

export function CreateServiceTicketModal({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  reservations,
  onSuccess,
}: CreateServiceTicketModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reservationId: "",
      price: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await createServiceTicket({
        stayId: values.reservationId,
        serviceId: serviceId,
        price: parseFloat(values.price),
        notes: values.notes || null,
      });

      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating service ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Añadir Boleta de Servicio</DialogTitle>
          <DialogDescription>
            Crear nueva boleta para el servicio: <strong>{serviceName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reservationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserva</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una Reserva" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reservations
                        .filter(
                          (reservation) =>
                            reservation.state === StayState.Active
                        )
                        .map((reservation) => (
                          <SelectItem
                            key={reservation.id}
                            value={reservation.id}
                          >
                            {reservation.holderName} -{" "}
                            {new Date(
                              reservation.arrivalDate
                            ).toLocaleDateString()}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales o comentarios..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
