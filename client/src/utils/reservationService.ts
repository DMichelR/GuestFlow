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
  arrivalDate: string; // ISO date string from API
  departureDate: string; // ISO date string from API
  reservationDate: string; // ISO date string from API
  pax: number;
  finalPrice: number | null;
  notes: string | null;
  state: StayState;
  companyId: string | null;
  companyName: string | null;
  assignedRooms: string[];
  guests: string[];
}

export interface CreateReservationDto {
  visitReasonId: string;
  holderId: string;
  arrivalDate: string; // Will be converted to ISO format
  departureDate: string; // Will be converted to ISO format
  pax: number;
  finalPrice?: number;
  notes?: string;
  state?: StayState;
  companyId?: string;
  roomIds: string[];
  guestIds: string[];
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
  finalPrice?: number | undefined;
  notes?: string | undefined;
  state?: StayState;
  companyId?: string | undefined;
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

// Cambiar el estado de una Reserva
export const changeReservationState = async (
  id: string,
  newState: StayState
): Promise<boolean> => {
  const stateNames = ["Pending", "Active", "Completed", "Canceled"];

  try {
    const response = await fetch(`/api/reservation-state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, state: stateNames[newState] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Error cambiando estado de la Reserva: ${response.status}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error al cambiar el estado de la Reserva:", error);
    throw error;
  }
};

// Helper function to check if a date is today
export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Helper function to ensure a string is a valid GUID
const ensureValidGuid = (id: string): string => {
  if (!id) return id;

  // Check if the ID is already a valid GUID
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return id;
  }

  // If it's a GUID without hyphens (32 characters), add the hyphens
  if (/^[0-9a-f]{32}$/i.test(id)) {
    return `${id.substring(0, 8)}-${id.substring(8, 12)}-${id.substring(
      12,
      16
    )}-${id.substring(16, 20)}-${id.substring(20)}`;
  }

  // Otherwise return as is
  return id;
};

// UpdateReservation DTO interface
export interface UpdateReservationDto {
  id: string;
  holderId?: string; // Agregamos holderId
  visitReasonId?: string;
  arrivalDate?: Date;
  departureDate?: Date;
  pax?: number;
  finalPrice?: number | null;
  notes?: string | null;
  state?: StayState;
  companyId?: string | null;
  roomIds?: string[];
  guestIds?: string[];
}

// Editar una Reserva existente
export const updateReservation = async (
  data: UpdateReservationDto
): Promise<Reservation> => {
  try {
    // Asegurarse de que los IDs son correctos (formato GUID)
    // Convertir fechas a ISO string para evitar problemas de serialización
    const formattedData = {
      ...data,
      arrivalDate:
        data.arrivalDate instanceof Date
          ? data.arrivalDate.toISOString()
          : data.arrivalDate,
      departureDate:
        data.departureDate instanceof Date
          ? data.departureDate.toISOString()
          : data.departureDate,
      roomIds: data.roomIds?.map((id) => ensureValidGuid(id)),
      guestIds: data.guestIds?.map((id) => ensureValidGuid(id)),
    };

    const response = await fetch(`/api/reservation-update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Error actualizando Reserva: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error al actualizar la Reserva:", error);
    throw error;
  }
};
