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
import { useUser } from "@clerk/nextjs";
import { getAllServices, Service } from "@/utils/serviceService";
import { getAllReservations, Reservation } from "@/utils/reservationService";
import { CreateServiceTicketModal } from "@/components/tickets/CreateServiceTicketModal";
// Remove toast import as it's not available yet
// We'll replace toast functionality with a simple alert for now

export default function TicketsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // All authenticated users (including staff) can add service tickets now
  const canAddServiceTickets = isLoaded && user !== null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesData, reservationsData] = await Promise.all([
          getAllServices(),
          getAllReservations(),
        ]);
        setServices(servicesData);
        setReservations(reservationsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar los datos"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenModal = (service: Service) => {
    if (!canAddServiceTickets) {
      alert("No tienes permisos para añadir boletas de servicio");
      return;
    }
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleSuccess = () => {
    // Replace toast with alert for now
    alert("Boleta de servicio creada con éxito");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Servicios</h1>
        <div className="flex justify-center items-center h-64">
          <p>Cargando servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Servicios</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>Error: {error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Servicios</h1>
      </div>

      {services.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-md text-center">
          <p className="text-gray-600 mb-4">No hay servicios disponibles</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Servicios</CardTitle>
            <CardDescription>
              Servicios disponibles para añadir a las reservaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(service)}
                        >
                          Añadir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedService && (
        <CreateServiceTicketModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          serviceId={selectedService.id}
          serviceName={selectedService.name}
          reservations={reservations}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
