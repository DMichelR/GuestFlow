"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTenant } from "@/utils/tenantService";
import { getAllCountries, Country } from "@/utils/countryService";
import { getCitiesByCountry, City } from "@/utils/cityService";

export default function CreateTenantPage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [cityId, setCityId] = useState<string | undefined>(undefined);

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Cargar países al iniciar
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const data = await getAllCountries();
        setCountries(data);
      } catch (err) {
        console.error("Error al cargar países:", err);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Cargar ciudades cuando se selecciona un país
  useEffect(() => {
    if (!countryId) {
      setCities([]);
      setCityId(undefined);
      return;
    }

    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const data = await getCitiesByCountry(countryId);
        setCities(data);
      } catch (err) {
        console.error("Error al cargar ciudades:", err);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, [countryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("El nombre del hotel es requerido");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await createTenant({
        name,
        address: address.trim() || undefined,
        countryId: countryId || undefined,
        cityId: cityId || undefined,
      });

      // Redirigir a la lista de tenants después de crear uno exitosamente
      router.push("/tenants");
      router.refresh(); // Forzar una actualización para mostrar el nuevo tenant
    } catch (err) {
      console.error("Error al crear el tenant:", err);
      setError(err instanceof Error ? err.message : "Error al crear el hotel");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Agregar Nuevo Hotel</CardTitle>
          <CardDescription>
            Ingresa la información del hotel que deseas agregar al sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Nombre del Hotel</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ingresa el nombre del hotel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Ingresa la dirección del hotel"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="country">País</Label>
                <Select
                  value={countryId}
                  onValueChange={(value) => {
                    setCountryId(value);
                    setCityId(undefined); // Resetear la ciudad cuando cambia el país
                  }}
                >
                  <SelectTrigger id="country">
                    <SelectValue
                      placeholder={
                        isLoadingCountries
                          ? "Cargando países..."
                          : "Seleccione un país"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="city">Ciudad</Label>
                <Select
                  value={cityId}
                  onValueChange={setCityId}
                  disabled={!countryId || isLoadingCities}
                >
                  <SelectTrigger id="city">
                    <SelectValue
                      placeholder={
                        !countryId
                          ? "Seleccione un país primero"
                          : isLoadingCities
                          ? "Cargando ciudades..."
                          : "Seleccione una ciudad"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Hotel"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
