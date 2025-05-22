"use client";

import { useState } from "react";
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
import { createTenant } from "@/utils/tenantService";

export default function CreateTenantPage() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("El nombre del hotel es requerido");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await createTenant({ name });

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
