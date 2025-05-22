// src/utils/reservationService.ts

// Interfaces
export enum StayState {
  Pending = 0,
  Active = 1,
  Completed = 2,
  Canceled = 3,
}

export interface Reservation {
  id: string;
  visitReasonId: string;
  visitReasonName: string;
  holderId: string;
  holderName: string;
  holderEmail: string;
  arrivalDate: string;
  departureDate: string;
  reservationDate: string;
  pax: number;
  finalPrice: number | null;
  notes: string | null;
  state: StayState;
  companyId: string | null;
  companyName: string | null;
  assignedRooms: string[];
  guests: string[];
}

// Get all reservations
export const getAllReservations = async (): Promise<Reservation[]> => {
  const response = await fetch(`/api/reservation-list`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching reservations: ${response.status}`);
  }

  return await response.json();
};

// Get reservation by ID
export const getReservationById = async (id: string): Promise<Reservation> => {
  const response = await fetch(`/api/reservation/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching reservation: ${response.status}`);
  }

  return await response.json();
};

// Helper function to format dates in a user-friendly way
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Helper function to get status badge variant based on reservation state
export const getStateVariant = (
  state: StayState
): "default" | "outline" | "secondary" | "destructive" => {
  switch (state) {
    case StayState.Active:
      return "default"; // green
    case StayState.Pending:
      return "secondary"; // yellow/gray
    case StayState.Completed:
      return "outline"; // outline
    case StayState.Canceled:
      return "destructive"; // red
    default:
      return "secondary";
  }
};

// Helper function to get state label
export const getStateLabel = (state: StayState): string => {
  switch (state) {
    case StayState.Active:
      return "Activa";
    case StayState.Pending:
      return "Pendiente";
    case StayState.Completed:
      return "Completada";
    case StayState.Canceled:
      return "Cancelada";
    default:
      return "Desconocido";
  }
};

// CreateReservation DTO interface
export interface CreateReservationDto {
  visitReasonId: string;
  holderId: string;
  arrivalDate: string;
  departureDate: string;
  pax: number;
  finalPrice?: number | null;
  notes?: string | null;
  state?: StayState;
  companyId?: string | null;
  roomIds: string[];
  guestIds: string[];
}

// Create a new reservation
export const createReservation = async (
  data: CreateReservationDto
): Promise<Reservation> => {
  const response = await fetch(`/api/reservation-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Error creating reservation: ${response.status}`
    );
  }

  return await response.json();
};
