// src/app/admin/CreateUserForm.tsx
"use client";

import { useState } from "react";
import { createUser } from "../../app/admin/_actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, useUser } from "@clerk/nextjs";

interface CreateUserFormProps {
  tenantId: string;
}

export const CreateUserForm = ({ tenantId }: CreateUserFormProps) => {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("staff");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();
  const { user } = useUser();

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      formData.append("role", role);
      formData.append("tenantId", tenantId);

      // Only append token if it's not null
      if (token) {
        formData.append("token", token);
      }

      const result = await createUser(formData);

      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error || "Failed to create user");
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
        <Button variant="default"> Nuevo Usuario</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Usuario</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
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
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" type="tel" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
            <p className="text-xs text-gray-500">
              La contraseña debe ser segura y no debe aparecer en filtraciones
              de datos
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="governmentId">Documento de identidad</Label>
              <Input id="governmentId" name="governmentId" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="birthDate">Fecha de nacimiento</Label>
              <Input id="birthDate" name="birthDate" type="date" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hireDate">Fecha de contratación</Label>
              <Input
                id="hireDate"
                name="hireDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="documentExpiry">Vencimiento del documento</Label>
            <Input id="documentExpiry" name="documentExpiry" type="date" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="emergencyContactName">
                Contacto de emergencia
              </Label>
              <Input id="emergencyContactName" name="emergencyContactName" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emergencyContactPhone">
                Teléfono de emergencia
              </Label>
              <Input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="tel"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                {/* Los managers no pueden crear otros managers */}
                {user?.publicMetadata?.role !== "manager" && (
                  <SelectItem value="manager">Gerente</SelectItem>
                )}
                <SelectItem value="receptionist">Recepcionista</SelectItem>
                <SelectItem value="staff">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear usuario"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
