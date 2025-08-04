"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { CreateGuestDto, createGuest } from "@/utils/guestService";
import { City, getAllCities, getCitiesByCountry } from "@/utils/cityService";
import { Country, getAllCountries } from "@/utils/countryService";
import {
  Profession,
  getAllProfessions,
  createProfession,
} from "@/utils/professionService";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schema validación del formulario
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  lastName: z
    .string()
    .min(2, { message: "El apellido debe tener al menos 2 caracteres" }),
  cid: z
    .string()
    .min(5, { message: "El CID/Documento debe tener al menos 5 caracteres" }),
  birthday: z.string({
    required_error: "La fecha de nacimiento es obligatoria",
  }),
  email: z.string().email({ message: "Ingrese un correo electrónico válido" }),
  phone: z
    .string()
    .min(5, { message: "El teléfono debe tener al menos 5 caracteres" }),
  address: z
    .string()
    .min(5, { message: "La dirección debe tener al menos 5 caracteres" }),
  professionId: z.string().optional().nullable(),
  cityId: z.string({ required_error: "La ciudad es obligatoria" }),
  countryId: z.string({ required_error: "El país es obligatorio" }),
});

type FormValues = z.infer<typeof formSchema>;

// Ya no necesitamos estas interfaces, las importamos desde los servicios

export default function CreateGuestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para datos
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);

  // Estado para calendar
  const [showBirthdayCalendar, setShowBirthdayCalendar] = useState(false);

  // Estado para el modal de nueva profesión
  const [showProfessionModal, setShowProfessionModal] = useState(false);
  const [newProfessionName, setNewProfessionName] = useState("");
  const [creatingProfession, setCreatingProfession] = useState(false);
  const [professionError, setProfessionError] = useState<string | null>(null);

  // Inicializar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lastName: "",
      cid: "",
      birthday: format(new Date(1990, 0, 1), "yyyy-MM-dd"),
      email: "",
      phone: "",
      address: "",
      professionId: null,
      cityId: "",
      countryId: "",
    },
  });

  // Cargar datos necesarios al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Intentar cargar datos de la API, si falla usamos datos de ejemplo
        try {
          const [countriesData, citiesData, professionsData] =
            await Promise.all([
              getAllCountries(),
              getAllCities(),
              getAllProfessions(),
            ]);

          if (countriesData.length > 0) {
            setCountries(countriesData);
          } else {
            // Datos de ejemplo si la API no devuelve nada
            setCountries([
              { id: "1", name: "Ecuador" },
              { id: "2", name: "Colombia" },
              { id: "3", name: "Perú" },
            ]);
          }

          if (citiesData.length > 0) {
            setCities(citiesData);
          } else {
            // Datos de ejemplo si la API no devuelve nada
            setCities([
              { id: "1", name: "Quito" },
              { id: "2", name: "Guayaquil" },
              { id: "3", name: "Cuenca" },
              { id: "4", name: "Bogotá" },
              { id: "5", name: "Lima" },
            ]);
          }

          if (professionsData.length > 0) {
            setProfessions(professionsData);
          } else {
            // Datos de ejemplo si la API no devuelve nada
            setProfessions([
              { id: "1", name: "Ingeniero" },
              { id: "2", name: "Médico" },
              { id: "3", name: "Abogado" },
              { id: "4", name: "Profesor" },
            ]);
          }
        } catch (apiError) {
          console.error(
            "Error al cargar datos de la API, usando datos de ejemplo",
            apiError
          );
          // Si la API falla, usamos datos de ejemplo
          setCountries([
            { id: "1", name: "Ecuador" },
            { id: "2", name: "Colombia" },
            { id: "3", name: "Perú" },
          ]);

          setCities([
            { id: "1", name: "Quito" },
            { id: "2", name: "Guayaquil" },
            { id: "3", name: "Cuenca" },
            { id: "4", name: "Bogotá" },
            { id: "5", name: "Lima" },
          ]);

          setProfessions([
            { id: "1", name: "Ingeniero" },
            { id: "2", name: "Médico" },
            { id: "3", name: "Abogado" },
            { id: "4", name: "Profesor" },
          ]);
        }
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

  // Función para manejar la selección de fechas
  const handleDateSelect = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    form.setValue("birthday", formattedDate);
    setShowBirthdayCalendar(false);
  };

  // Función para crear una nueva profesión
  const handleCreateProfession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProfessionName.trim()) {
      setProfessionError("El nombre de la profesión no puede estar vacío");
      return;
    }

    try {
      setCreatingProfession(true);
      setProfessionError(null);

      // Llamar a la API para crear la profesión
      const createdProfession = await createProfession({
        name: newProfessionName,
      });

      // Agregar la nueva profesión a la lista y seleccionarla
      setProfessions((prev) => [...prev, createdProfession]);
      form.setValue("professionId", createdProfession.id);

      // Cerrar el modal y limpiar el nombre
      setShowProfessionModal(false);
      setNewProfessionName("");
    } catch (err) {
      console.error("Error al crear profesión:", err);
      setProfessionError(
        err instanceof Error ? err.message : "Error al crear la nueva profesión"
      );
    } finally {
      setCreatingProfession(false);
    }
  };

  // Enviar el formulario
  const onSubmit = async (data: FormValues) => {
    // Si el modal de profesión está abierto, no enviar el formulario
    if (showProfessionModal) return;

    try {
      setLoading(true);
      setError(null);

      // Preparar los datos para enviar a la API
      const guestData: CreateGuestDto = {
        name: data.name,
        lastName: data.lastName,
        cid: data.cid,
        birthday: data.birthday,
        email: data.email,
        phone: data.phone,
        address: data.address,
        professionId: data.professionId === "" ? null : data.professionId,
        cityId: data.cityId,
        countryId: data.countryId,
      };

      // Enviar los datos a la API
      console.log("Datos del huésped:", guestData);
      await createGuest(guestData);

      // Redireccionar a la lista de huéspedes
      router.push("/guests");
    } catch (err) {
      console.error("Error creating guest:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al crear el huésped"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Registrar Nuevo Huésped</h1>
        <Button variant="outline" onClick={() => router.push("/guests")}>
          Cancelar
        </Button>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200 text-red-700">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formulario de Registro</CardTitle>
          <CardDescription>
            Complete el formulario para registrar un nuevo huésped
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ingrese el nombre" {...field} />
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
                        <Input placeholder="Ingrese el apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CID/Documento */}
                <FormField
                  control={form.control}
                  name="cid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CID/Documento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ingrese el número de documento"
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
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            onClick={() => setShowBirthdayCalendar(true)}
                            readOnly
                            placeholder="Seleccionar fecha"
                          />
                        </FormControl>
                        {showBirthdayCalendar && (
                          <Dialog
                            open={true}
                            onOpenChange={setShowBirthdayCalendar}
                          >
                            <DialogContent className="p-0 max-w-fit">
                              <Calendar
                                date={
                                  field.value
                                    ? new Date(field.value)
                                    : new Date(1990, 0, 1)
                                }
                                locale={es}
                                onChange={handleDateSelect}
                                maxDate={new Date()}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
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
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="ejemplo@correo.com" {...field} />
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
                        <Input placeholder="+593 999999999" {...field} />
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
                          // Actualizar ciudades al cambiar el país
                          const loadCitiesForCountry = async () => {
                            try {
                              const citiesForCountry = await getCitiesByCountry(
                                value
                              );
                              if (citiesForCountry.length > 0) {
                                setCities(citiesForCountry);
                              }
                              // Resetear la ciudad seleccionada
                              form.setValue("cityId", "");
                            } catch (error) {
                              console.error(
                                "Error al cargar ciudades para el país:",
                                error
                              );
                            }
                          };
                          loadCitiesForCountry();
                        }}
                        defaultValue={field.value}
                        disabled={loading || countries.length === 0}
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
                        disabled={loading || cities.length === 0}
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
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Profesión (opcional)</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowProfessionModal(true)}
                          className="h-7 px-2 text-xs"
                        >
                          +
                        </Button>
                      </div>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value === "none" ? null : value);
                        }}
                        value={field.value || "none"}
                        disabled={loading || professions.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una profesión" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          {professions.map((profession) => (
                            <SelectItem
                              key={profession.id}
                              value={profession.id}
                            >
                              {profession.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Modal para crear nueva profesión */}
                <Dialog
                  open={showProfessionModal}
                  onOpenChange={setShowProfessionModal}
                >
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Nueva Profesión</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={handleCreateProfession}
                      className="space-y-4"
                    >
                      {professionError && (
                        <Alert className="bg-red-50 border-red-200 text-red-700">
                          <AlertDescription>{professionError}</AlertDescription>
                        </Alert>
                      )}
                      <div className="grid gap-2">
                        <Label htmlFor="profession-name">
                          Nombre de la profesión
                        </Label>
                        <Input
                          id="profession-name"
                          value={newProfessionName}
                          onChange={(e) => setNewProfessionName(e.target.value)}
                          placeholder="Ej: Ingeniero, Médico, Abogado..."
                          disabled={creatingProfession}
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowProfessionModal(false)}
                          disabled={creatingProfession}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={creatingProfession}>
                          {creatingProfession
                            ? "Guardando..."
                            : "Guardar Profesión"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Dirección */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ingrese la dirección completa"
                        {...field}
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
                  onClick={() => router.push("/guests")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Huésped"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Modal para nueva profesión */}
      <Dialog open={showProfessionModal} onOpenChange={setShowProfessionModal}>
        <DialogContent className="p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-4">
            Registrar Nueva Profesión
          </h2>

          {professionError && (
            <Alert className="mb-4 bg-red-50 border-red-200 text-red-700">
              <AlertDescription>{professionError}</AlertDescription>
            </Alert>
          )}

          <div className="mb-4">
            <Input
              placeholder="Ingrese el nombre de la profesión"
              value={newProfessionName}
              onChange={(e) => setNewProfessionName(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={creatingProfession}
              onClick={() => setShowProfessionModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProfession}
              disabled={creatingProfession}
            >
              {creatingProfession ? "Guardando..." : "Guardar Profesión"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
