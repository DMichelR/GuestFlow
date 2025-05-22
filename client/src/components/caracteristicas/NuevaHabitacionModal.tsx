"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NuevaHabitacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RoomType {
  id: string;
  name: string;
}

interface FormValues {
  number: string;
  floor: string;
  roomTypeId: string;
  status: string;
}

export function NuevaHabitacionModal({
  isOpen,
  onClose,
  onSuccess,
}: NuevaHabitacionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      number: "",
      floor: "",
      roomTypeId: "",
      status: "Disponible",
    },
  });

  const selectedRoomTypeId = watch("roomTypeId");

  useEffect(() => {
    async function fetchRoomTypes() {
      try {
        setIsLoadingRoomTypes(true);
        const response = await fetch("/api/room-types");

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setRoomTypes(data);
      } catch (error) {
        console.error("Error al cargar tipos de habitaciones:", error);
      } finally {
        setIsLoadingRoomTypes(false);
      }
    }

    if (isOpen) {
      fetchRoomTypes();
    }
  }, [isOpen]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: data.number,
          floor: data.floor,
          roomTypeId: data.roomTypeId,
          status: data.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la habitación");
      }

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomTypeChange = (value: string) => {
    setValue("roomTypeId", value);
  };

  const handleStatusChange = (value: string) => {
    setValue("status", value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Nueva Habitación</DialogTitle>
            <DialogDescription>
              Completa los campos para crear una nueva habitación
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number" className="text-right">
                Número
              </Label>
              <Input
                id="number"
                className="col-span-3"
                {...register("number", {
                  required: "Este campo es obligatorio",
                })}
              />
              {errors.number && (
                <p className="text-red-500 text-sm col-span-4 text-right">
                  {errors.number.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="floor" className="text-right">
                Piso
              </Label>
              <Input
                id="floor"
                className="col-span-3"
                {...register("floor", {
                  required: "Este campo es obligatorio",
                })}
              />
              {errors.floor && (
                <p className="text-red-500 text-sm col-span-4 text-right">
                  {errors.floor.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomType" className="text-right">
                Tipo
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={handleRoomTypeChange}
                  value={selectedRoomTypeId}
                  disabled={isLoadingRoomTypes}
                >
                  <SelectTrigger id="roomType">
                    <SelectValue placeholder="Seleccionar tipo de habitación" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roomTypeId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.roomTypeId.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={handleStatusChange}
                  defaultValue="Disponible"
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Ocupada">Ocupada</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
            <Button type="submit" disabled={isLoading || isLoadingRoomTypes}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
