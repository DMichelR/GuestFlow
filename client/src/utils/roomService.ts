// src/utils/roomService.ts

export enum RoomStatus {
  Available = 0,
  Occupied = 1,
  Maintenance = 2,
  Cleaning = 3,
  OutOfOrder = 4,
}

export interface Room {
  id: string;
  number: string; // Campo original
  roomNumber?: string; // Adaptador para compatibilidad
  roomTypeId: string;
  roomTypeName: string;
  roomTypePrice: number;
  status: RoomStatus;
  tenantId: string;
  tenantName: string;
  type?: string; // Adaptador para compatibilidad
  capacity?: number; // Adaptador para compatibilidad
  created: string;
  updated: string;
}

// Get all available rooms
export const getAvailableRooms = async (
  tokenOrStartDate: string | Date,
  startDateOrEndDate: Date,
  endDateOrExcludeId?: Date | string
): Promise<Room[]> => {
  // Format dates to match "2025-05-22 15:00:00.000000 +00:00" format using DateTime methods
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Determinar si se llamó con token o directamente con fechas
  // Si tokenOrStartDate es string, es un token y los otros parámetros son fechas
  // Si tokenOrStartDate es Date, no hay token y los parámetros son fechas
  let token: string | null = null;
  let startDate: Date;
  let endDate: Date;
  let excludeReservationId: string | undefined;

  if (
    typeof tokenOrStartDate === "string" &&
    startDateOrEndDate instanceof Date &&
    endDateOrExcludeId instanceof Date
  ) {
    // Llamada desde el formulario de creación: token, startDate, endDate
    token = tokenOrStartDate;
    startDate = startDateOrEndDate;
    endDate = endDateOrExcludeId;
  } else if (
    tokenOrStartDate instanceof Date &&
    startDateOrEndDate instanceof Date
  ) {
    // Llamada desde el formulario de edición: startDate, endDate, excludeReservationId?
    startDate = tokenOrStartDate;
    endDate = startDateOrEndDate;
    excludeReservationId =
      typeof endDateOrExcludeId === "string" ? endDateOrExcludeId : undefined;
  } else {
    throw new Error("Invalid parameters for getAvailableRooms");
  }

  const params = new URLSearchParams({
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  });

  if (excludeReservationId) {
    params.append("excludeReservationId", excludeReservationId);
  }

  const response = await fetch(`/api/rooms/available?${params.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching available rooms: ${response.status}`);
  }

  return await response.json();
};

// Get all rooms
export const getAllRooms = async (): Promise<Room[]> => {
  const response = await fetch(`/api/rooms`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching rooms: ${response.status}`);
  }

  return await response.json();
};

// Get room by ID
export const getRoomById = async (id: string): Promise<Room> => {
  const response = await fetch(`/api/rooms/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching room: ${response.status}`);
  }

  const room = await response.json();

  // Asignar propiedades para compatibilidad con el componente
  return {
    ...room,
    roomNumber: room.number,
    type: room.roomTypeName,
    capacity: 2, // Valor por defecto si no existe en la respuesta
  };
};
