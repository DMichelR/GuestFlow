"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
      setRoomTypes(data);
    } catch (error) {
      console.error("Error al cargar tipos de habitaciones:", error);
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
      setServices([]);
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
      setRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Administrar Características
            </h1>
            <p className="text-gray-600">
              Gestione tipos de habitación, servicios y habitaciones del hotel
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Tipos de Habitaciones */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Tipos de Habitaciones
                      </h2>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsRoomTypeModalOpen(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                    size="sm"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Nuevo
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {isLoadingRoomTypes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : roomTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">
                      No hay tipos de habitación registrados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roomTypes.slice(0, 5).map((type) => (
                      <div
                        key={type.id}
                        className="flex justify-between items-center p-3 bg-purple-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {type.name}
                          </p>
                          <p className="text-sm text-gray-600">${type.price}</p>
                        </div>
                      </div>
                    ))}
                    {roomTypes.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        Y {roomTypes.length - 5} más...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Servicios */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 4V2a1 1 0 011-1h3a1 1 0 011 1v2h4a1 1 0 011 1v3a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9H5a1 1 0 01-1-1V5a1 1 0 011-1h2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Servicios
                      </h2>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsServiceModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    size="sm"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Nuevo
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {isLoadingServices ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 4V2a1 1 0 011-1h3a1 1 0 011 1v2h4a1 1 0 011 1v3a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9H5a1 1 0 01-1-1V5a1 1 0 011-1h2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">
                      No hay servicios registrados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.slice(0, 5).map((service) => (
                      <div
                        key={service.id}
                        className="p-3 bg-green-50 rounded-lg"
                      >
                        <p className="font-medium text-gray-900">
                          {service.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {service.description}
                        </p>
                      </div>
                    ))}
                    {services.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        Y {services.length - 5} más...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Habitaciones */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Habitaciones
                      </h2>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsRoomModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    size="sm"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Nueva
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {isLoadingRooms ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-orange-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">
                      No hay habitaciones registradas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rooms.slice(0, 5).map((room) => (
                      <div
                        key={room.id}
                        className="flex justify-between items-center p-3 bg-orange-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            Habitación {room.number}
                          </p>
                          <p className="text-sm text-gray-600">
                            {room.roomTypeName}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            room.status === "Available"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {room.status}
                        </span>
                      </div>
                    ))}
                    {rooms.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        Y {rooms.length - 5} más...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
