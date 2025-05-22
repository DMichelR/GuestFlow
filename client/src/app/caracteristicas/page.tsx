"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import { NuevoTipoModal } from "@/components/caracteristicas/NuevoTipoModal";
import { NuevoServicioModal } from "@/components/caracteristicas/NuevoServicioModal";
import { NuevaHabitacionModal } from "@/components/caracteristicas/NuevaHabitacionModal";

interface RoomType {
  id: string;
  name: string;
  price: number;
  tenantId: string;
  tenantName: string;
  created: string;
  updated: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  tenantName: string;
  created: string;
  updated: string;
}

interface Room {
  id: string;
  number: string;
  floor: string;
  status: string;
  roomTypeId: string;
  roomTypeName: string;
  tenantId: string;
  tenantName: string;
  created: string;
  updated: string;
}

export default function AdministrarCaracteristicas() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Estados para controlar los modales
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  useEffect(() => {
    fetchRoomTypes();
    fetchServices();
    fetchRooms();
  }, []);

  async function fetchRoomTypes() {
    try {
      const response = await fetch("/api/room-types");

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Tipos de habitaciones:", data);
      setRoomTypes(data);
    } catch (error) {
      console.error("Error al cargar tipos de habitaciones:", error);
      // Mostrar lista vacía en caso de error
      setRoomTypes([]);
    } finally {
      setIsLoadingRoomTypes(false);
    }
  }

  async function fetchServices() {
    try {
      setIsLoadingServices(true);
      const response = await fetch("/api/services");

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    } finally {
      setIsLoadingServices(false);
    }
  }

  async function fetchRooms() {
    try {
      setIsLoadingRooms(true);
      const response = await fetch("/api/rooms");

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Error al cargar habitaciones:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Administrar Características</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipos de Habitaciones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Tipos de Habitaciones</CardTitle>
              <CardDescription>
                Gestiona los tipos de habitaciones disponibles en tu hotel
              </CardDescription>
            </div>
            <Button
              className="flex items-center gap-2"
              onClick={() => setIsRoomTypeModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Nuevo Tipo
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingRoomTypes ? (
              <div className="flex justify-center py-8">
                <p>Cargando tipos de habitaciones...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomTypes.length > 0 ? (
                    roomTypes.map((roomType) => (
                      <TableRow key={roomType.id}>
                        <TableCell className="font-medium">
                          {roomType.name}
                        </TableCell>
                        <TableCell>${roomType.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2">
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm">
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No hay tipos de habitación disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Servicios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Servicios</CardTitle>
              <CardDescription>
                Gestiona los servicios que ofrece tu hotel
              </CardDescription>
            </div>
            <Button
              className="flex items-center gap-2"
              onClick={() => setIsServiceModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Nuevo Servicio
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingServices ? (
              <div className="flex justify-center py-8">
                <p>Cargando servicios...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.length > 0 ? (
                    services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">
                          {service.name}
                        </TableCell>
                        <TableCell>{service.description}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2">
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm">
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No hay servicios disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Habitaciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Habitaciones</CardTitle>
            <CardDescription>
              Gestiona las habitaciones de tu hotel
            </CardDescription>{" "}
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => setIsRoomModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Nueva Habitación
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingRooms ? (
            <div className="flex justify-center py-8">
              <p>Cargando habitaciones...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">
                        {room.number}
                      </TableCell>
                      <TableCell>{room.roomTypeName}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            room.status === "Disponible"
                              ? "bg-green-100 text-green-800"
                              : room.status === "Ocupada"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {room.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2">
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm">
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No hay habitaciones disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <NuevoTipoModal
        isOpen={isRoomTypeModalOpen}
        onClose={() => setIsRoomTypeModalOpen(false)}
        onSuccess={fetchRoomTypes}
      />

      <NuevoServicioModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSuccess={fetchServices}
      />

      <NuevaHabitacionModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={fetchRooms}
      />
    </div>
  );
}
