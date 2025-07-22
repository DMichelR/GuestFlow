// src/utils/serviceService.ts

export interface Service {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  tenantName: string;
  created: string;
  updated: string;
}

// Interface for service tickets
export interface ServiceTicket {
  id: string;
  stayId: string;
  stayReservationNumber: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName: string;
  price: number;
  notes: string | null;
  tenantId: string;
  tenantName: string;
  created: string;
  updated: string;
}

// Interface for creating a service ticket
export interface CreateServiceTicketDto {
  stayId: string;
  serviceId: string;
  price: number;
  notes?: string | null;
}

// Get all services
export const getAllServices = async (): Promise<Service[]> => {
  try {
    const response = await fetch(`/api/services`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching services: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching services:", error);
    return []; // Return empty array in case of error
  }
};

// Get service tickets by reservation ID
export const getServiceTicketsByReservationId = async (
  reservationId: string
): Promise<ServiceTicket[]> => {
  try {
    const response = await fetch(
      `/api/service-tickets/reservation/${reservationId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching service tickets: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching service tickets:", error);
    return []; // Return empty array in case of error
  }
};

// Create a service ticket
export const createServiceTicket = async (
  data: CreateServiceTicketDto
): Promise<ServiceTicket> => {
  try {
    const response = await fetch(`/api/service-tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Error creating service ticket: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating service ticket:", error);
    throw error;
  }
};
