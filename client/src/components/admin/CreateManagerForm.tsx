// src/components/admin/CreateManagerForm.tsx
"use client";

import { useEffect, useState } from "react";
import { createManager } from "../../app/admin/_actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@clerk/nextjs";
import { UserPlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Definición de la interfaz para los tenants
interface Tenant {
  id: string;
  name: string;
}

// Ya no necesitamos recibir el tenantId como prop
export const CreateManagerForm = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const { getToken } = useAuth();

  // Cargar la lista de tenants cuando se abre el diálogo
  useEffect(() => {
    const fetchTenants = async () => {
      if (open) {
        setIsLoadingTenants(true);
        try {
          const response = await fetch("/api/tenant-list");
          if (!response.ok) {
            throw new Error("Error al cargar los tenants");
          }
          const data = await response.json();
          setTenants(data);

          // Seleccionar el primer tenant por defecto si hay alguno
          if (data.length > 0) {
            setSelectedTenantId(data[0].id);
          } else {
            console.log("No tenants available");
            setError("No hay hoteles disponibles para asignar");
          }
        } catch (err) {
          console.error("Error fetching tenants:", err);
          setError("No se pudo cargar la lista de hoteles");
        } finally {
          setIsLoadingTenants(false);
        }
      }
    };

    fetchTenants();
  }, [open]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validar que se haya seleccionado un tenant
    if (!selectedTenantId) {
      setError("Debe seleccionar un hotel para el manager");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await getToken();

      // Ya no necesitamos asignar el rol, createManager lo hace automáticamente
      formData.append("tenantId", selectedTenantId);

      // Only append token if it's not null
      if (token) {
        formData.append("token", token);
      }

      const result = await createManager(formData);

      if (result.success) {
        setSuccess(
          "Manager creado exitosamente. La página se actualizará en 3 segundos."
        );
        // Cerrar el diálogo después de 3 segundos
        setTimeout(() => {
          setOpen(false);
          // Recargar la página para mostrar el nuevo manager
          window.location.reload();
        }, 3000);
      } else {
        setError(result.error || "Failed to create manager");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md shadow-sm"
        >
          <UserPlusIcon size={18} />
          Crear Nuevo Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Manager</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded text-sm">
              {success}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="tenant">Hotel</Label>
            <Select
              value={selectedTenantId}
              onValueChange={setSelectedTenantId}
              disabled={isLoadingTenants || tenants.length === 0}
            >
              <SelectTrigger id="tenant">
                <SelectValue
                  placeholder={
                    isLoadingTenants ? "Cargando..." : "Seleccione un hotel"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tenants.length === 0 && !isLoadingTenants && (
              <p className="text-xs text-red-500">
                No hay hoteles disponibles. Por favor, cree un hotel primero.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" name="firstName" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" name="lastName" required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
            <p className="text-xs text-gray-500">
              La contraseña debe ser segura y no encontrarse en bases de datos
              de filtraciones
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting || selectedTenantId === "" || tenants.length === 0
            }
          >
            {isSubmitting ? "Creando..." : "Crear Manager"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
