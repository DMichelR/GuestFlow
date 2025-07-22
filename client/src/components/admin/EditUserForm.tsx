"use client";
import { useState } from "react";
import { updateUser } from "../../app/admin/_actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface EditUserFormProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    governmentId?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    birthDate?: string;
    hireDate?: string;
    documentExpiry?: string;
  };
  onSave: (updatedUser: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    governmentId?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    birthDate?: string;
    hireDate?: string;
    documentExpiry?: string;
  }) => void;
}

export function EditUserForm({ user, onSave }: EditUserFormProps) {
  const [editedUser, setEditedUser] = useState({
    ...user,
    phone: user.phone || "",
    address: user.address || "",
    governmentId: user.governmentId || "",
    emergencyContactName: user.emergencyContactName || "",
    emergencyContactPhone: user.emergencyContactPhone || "",
    birthDate: user.birthDate || "",
    hireDate: user.hireDate || "",
    documentExpiry: user.documentExpiry || "",
  });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usamos el email como identificador porque es más confiable para encontrar al usuario en la API
      const email = user.email;
      if (!email) {
        throw new Error("No se pudo obtener el email del usuario");
      }

      const response = await fetch(`/api/user/${encodeURIComponent(email)}`);

      if (!response.ok) {
        throw new Error(
          `Error al obtener datos del usuario: ${response.status}`
        );
      }

      const userData = await response.json();

      console.log("Datos del usuario obtenidos de la API:", userData);

      // Actualizar el estado con los datos obtenidos de la API
      setEditedUser({
        ...editedUser,
        firstName: userData.firstName || editedUser.firstName,
        lastName: userData.lastName || editedUser.lastName,
        email: userData.email || editedUser.email,
        phone: userData.phone || "",
        address: userData.address || "",
        governmentId: userData.governmentId || "",
        emergencyContactName: userData.emergencyContactName || "",
        emergencyContactPhone: userData.emergencyContactPhone || "",
        birthDate: userData.birthDate
          ? new Date(userData.birthDate).toISOString().split("T")[0]
          : "",
        hireDate: userData.hireDate
          ? new Date(userData.hireDate).toISOString().split("T")[0]
          : "",
        documentExpiry: userData.documentExpiry
          ? new Date(userData.documentExpiry).toISOString().split("T")[0]
          : "",
      });
    } catch (err) {
      console.error("Error al obtener datos del usuario:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la apertura del diálogo
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Cuando se abre el diálogo, cargar los datos del usuario desde la API
      fetchUserDetails();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("id", user.id);
    formData.append("firstName", editedUser.firstName);
    formData.append("lastName", editedUser.lastName);
    formData.append("email", editedUser.email);

    // Siempre añadir los campos, incluso si están vacíos
    formData.append("phone", editedUser.phone || "");
    formData.append("address", editedUser.address || "");
    formData.append("governmentId", editedUser.governmentId || "");
    formData.append(
      "emergencyContactName",
      editedUser.emergencyContactName || ""
    );
    formData.append(
      "emergencyContactPhone",
      editedUser.emergencyContactPhone || ""
    );
    formData.append("birthDate", editedUser.birthDate || "");

    // Para hireDate, usar la fecha actual si no está definido
    formData.append(
      "hireDate",
      editedUser.hireDate || new Date().toISOString().split("T")[0]
    );

    formData.append("documentExpiry", editedUser.documentExpiry || "");

    // Verificar que los datos se están enviando correctamente
    console.log("Enviando datos de usuario:", {
      id: user.id,
      firstName: editedUser.firstName,
      lastName: editedUser.lastName,
      email: editedUser.email,
      phone: editedUser.phone,
      address: editedUser.address,
      governmentId: editedUser.governmentId,
      emergencyContactName: editedUser.emergencyContactName,
      emergencyContactPhone: editedUser.emergencyContactPhone,
      birthDate: editedUser.birthDate,
      hireDate: editedUser.hireDate,
      documentExpiry: editedUser.documentExpiry,
    });

    await updateUser(formData);
    onSave(editedUser);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Cargando datos...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
            <p>Error: {error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchUserDetails}
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <form className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editedUser.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={editedUser.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={editedUser.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={editedUser.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  value={editedUser.address || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="governmentId">Documento de Identidad</Label>
                <Input
                  id="governmentId"
                  name="governmentId"
                  value={editedUser.governmentId || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={editedUser.birthDate || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hireDate">Fecha de Contratación</Label>
                <Input
                  id="hireDate"
                  name="hireDate"
                  type="date"
                  value={
                    editedUser.hireDate ||
                    new Date().toISOString().split("T")[0]
                  }
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="documentExpiry">Vencimiento del Documento</Label>
              <Input
                id="documentExpiry"
                name="documentExpiry"
                type="date"
                value={editedUser.documentExpiry || ""}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="emergencyContactName">
                  Contacto de Emergencia
                </Label>
                <Input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={editedUser.emergencyContactName || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emergencyContactPhone">
                  Teléfono de Emergencia
                </Label>
                <Input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  value={editedUser.emergencyContactPhone || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <Button type="button" className="w-full" onClick={handleSave}>
              Guardar Cambios
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
