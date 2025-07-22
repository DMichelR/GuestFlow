"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
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
import { DatePicker } from "@/components/ui/date-picker";
import { Country, getAllCountries } from "@/utils/countryService";
import { City, getCitiesByCountry } from "@/utils/cityService";
import { Profession, getAllProfessions } from "@/utils/professionService";
import { CreateGuestDto, createGuest } from "@/utils/guestService";

// Schema para validación del formulario
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Nombre debe tener al menos 2 caracteres" }),
  lastName: z
    .string()
    .min(2, { message: "Apellido debe tener al menos 2 caracteres" }),
  cid: z
    .string()
    .min(5, { message: "Cédula/Pasaporte debe tener al menos 5 caracteres" }),
  email: z.string().email({ message: "Email no válido" }),
  phone: z
    .string()
    .min(5, { message: "Teléfono debe tener al menos 5 caracteres" }),
  birthday: z.date({
    required_error: "La fecha de nacimiento es obligatoria",
  }),
  address: z
    .string()
    .min(5, { message: "Dirección debe tener al menos 5 caracteres" }),
  countryId: z.string({
    required_error: "El país es obligatorio",
  }),
  cityId: z.string({
    required_error: "La ciudad es obligatoria",
  }),
  professionId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (guest: unknown) => void;
}

export function CreateGuestModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateGuestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Inicializar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lastName: "",
      cid: "",
      email: "",
      phone: "",
      birthday: new Date(1990, 0, 1),
      address: "",
      countryId: "",
      cityId: "",
      professionId: "",
    },
  });

  // Cargar países, ciudades y profesiones al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesData, professionsData] = await Promise.all([
          getAllCountries(),
          getAllProfessions(),
        ]);
        setCountries(countriesData);
        setProfessions(professionsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Actualizar ciudades cuando cambia el país seleccionado
  useEffect(() => {
    const fetchCities = async () => {
      if (selectedCountry) {
        try {
          const citiesData = await getCitiesByCountry(selectedCountry);
          setCities(citiesData);
          // Si cambiamos el país, resetear la ciudad seleccionada
          form.setValue("cityId", "");
        } catch (error) {
          console.error("Error fetching cities:", error);
          setCities([]);
        }
      } else {
        setCities([]);
      }
    };

    fetchCities();
  }, [selectedCountry, form]);

  // Función para enviar el formulario
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      const guestData: CreateGuestDto = {
        name: data.name,
        lastName: data.lastName,
        cid: data.cid,
        email: data.email,
        phone: data.phone,
        birthday: data.birthday.toISOString().split("T")[0],
        address: data.address,
        countryId: data.countryId,
        cityId: data.cityId,
        professionId: data.professionId || null,
      };

      const newGuest = await createGuest(guestData);

      // Resetear el formulario y cerrar el modal
      form.reset();
      onSuccess(newGuest);
      onClose();
    } catch (error) {
      console.error("Error creating guest:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Huésped</DialogTitle>
          <DialogDescription>
            Completa el formulario para registrar un nuevo huésped
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Apellido */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cédula/Pasaporte */}
              <FormField
                control={form.control}
                name="cid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula/Pasaporte</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número de identificación"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha de nacimiento */}
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => field.onChange(date)}
                        placeholder="Seleccionar fecha de nacimiento"
                        maxDate={new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="correo@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Teléfono */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de teléfono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* País */}
              <FormField
                control={form.control}
                name="countryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ciudad */}
              <FormField
                control={form.control}
                name="cityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!selectedCountry || cities.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una ciudad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Profesión (opcional) */}
              <FormField
                control={form.control}
                name="professionId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Profesión (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una profesión (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        {professions.map((profession) => (
                          <SelectItem key={profession.id} value={profession.id}>
                            {profession.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Este campo es opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dirección */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Huésped"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
