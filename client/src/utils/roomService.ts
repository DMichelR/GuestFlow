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
    // Use same-origin: safer when client and API are on the same origin
    credentials: "same-origin",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Error fetching available rooms: ${response.status} ${response.statusText} - ${body}`
    );
  }

  const data = await response.json();

  // Normalize room objects to ensure downstream consumers have consistent properties
  if (Array.isArray(data)) {
    return data.map((r: unknown) => {
      const obj = (r as Record<string, unknown>) || {};
      const id =
        typeof obj["id"] === "string"
          ? (obj["id"] as string)
          : String(obj["id"] ?? "");
      const roomNumber =
        typeof obj["roomNumber"] === "string"
          ? (obj["roomNumber"] as string)
          : typeof obj["number"] === "string"
          ? (obj["number"] as string)
          : id;
      const roomTypeName =
        typeof obj["roomTypeName"] === "string"
          ? (obj["roomTypeName"] as string)
          : typeof obj["type"] === "string"
          ? (obj["type"] as string)
          : "";
      const roomTypePrice =
        typeof obj["roomTypePrice"] === "number"
          ? (obj["roomTypePrice"] as number)
          : typeof obj["price"] === "number"
          ? (obj["price"] as number)
          : 0;
      const status =
        typeof obj["status"] === "number"
          ? (obj["status"] as number)
          : RoomStatus.Available;
      const tenantId =
        typeof obj["tenantId"] === "string" ? (obj["tenantId"] as string) : "";
      const tenantName =
        typeof obj["tenantName"] === "string"
          ? (obj["tenantName"] as string)
          : "";
      const capacity =
        typeof obj["capacity"] === "number"
          ? (obj["capacity"] as number)
          : typeof obj["maxCapacity"] === "number"
          ? (obj["maxCapacity"] as number)
          : 2;
      const created =
        typeof obj["created"] === "string"
          ? (obj["created"] as string)
          : String(obj["createdAt"] ?? "");
      const updated =
        typeof obj["updated"] === "string"
          ? (obj["updated"] as string)
          : String(obj["updatedAt"] ?? "");

      return {
        id,
        number: roomNumber,
        roomNumber,
        roomTypeId:
          typeof obj["roomTypeId"] === "string"
            ? (obj["roomTypeId"] as string)
            : "",
        roomTypeName,
        roomTypePrice,
        status,
        tenantId,
        tenantName,
        type: roomTypeName,
        capacity,
        created,
        updated,
      } as Room;
    });
  }

  // If API returns a single object for some reason, normalize and return in array
  const single = data as unknown;
  const obj = (single as Record<string, unknown>) || {};
  const id =
    typeof obj["id"] === "string"
      ? (obj["id"] as string)
      : String(obj["id"] ?? "");
  const roomNumber =
    typeof obj["roomNumber"] === "string"
      ? (obj["roomNumber"] as string)
      : typeof obj["number"] === "string"
      ? (obj["number"] as string)
      : id;
  return [
    {
      id,
      number: roomNumber,
      roomNumber,
      roomTypeId:
        typeof obj["roomTypeId"] === "string"
          ? (obj["roomTypeId"] as string)
          : "",
      roomTypeName:
        typeof obj["roomTypeName"] === "string"
          ? (obj["roomTypeName"] as string)
          : typeof obj["type"] === "string"
          ? (obj["type"] as string)
          : "",
      roomTypePrice:
        typeof obj["roomTypePrice"] === "number"
          ? (obj["roomTypePrice"] as number)
          : typeof obj["price"] === "number"
          ? (obj["price"] as number)
          : 0,
      status:
        typeof obj["status"] === "number"
          ? (obj["status"] as number)
          : RoomStatus.Available,
      tenantId:
        typeof obj["tenantId"] === "string" ? (obj["tenantId"] as string) : "",
      tenantName:
        typeof obj["tenantName"] === "string"
          ? (obj["tenantName"] as string)
          : "",
      type:
        typeof obj["type"] === "string"
          ? (obj["type"] as string)
          : typeof obj["roomTypeName"] === "string"
          ? (obj["roomTypeName"] as string)
          : "",
      capacity:
        typeof obj["capacity"] === "number"
          ? (obj["capacity"] as number)
          : typeof obj["maxCapacity"] === "number"
          ? (obj["maxCapacity"] as number)
          : 2,
      created:
        typeof obj["created"] === "string"
          ? (obj["created"] as string)
          : String(obj["createdAt"] ?? ""),
      updated:
        typeof obj["updated"] === "string"
          ? (obj["updated"] as string)
          : String(obj["updatedAt"] ?? ""),
    } as Room,
  ];
};

// Get all rooms
export const getAllRooms = async (): Promise<Room[]> => {
  const response = await fetch(`/api/rooms`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Error fetching rooms: ${response.status} ${response.statusText} - ${body}`
    );
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data.map((item: unknown) => {
      const obj = (item as Record<string, unknown>) || {};
      const id =
        typeof obj["id"] === "string"
          ? (obj["id"] as string)
          : String(obj["id"] ?? "");
      const roomNumber =
        typeof obj["roomNumber"] === "string"
          ? (obj["roomNumber"] as string)
          : typeof obj["number"] === "string"
          ? (obj["number"] as string)
          : id;
      const roomTypeId =
        typeof obj["roomTypeId"] === "string"
          ? (obj["roomTypeId"] as string)
          : "";
      const roomTypeName =
        typeof obj["roomTypeName"] === "string"
          ? (obj["roomTypeName"] as string)
          : typeof obj["type"] === "string"
          ? (obj["type"] as string)
          : "";
      const roomTypePrice =
        typeof obj["roomTypePrice"] === "number"
          ? (obj["roomTypePrice"] as number)
          : typeof obj["price"] === "number"
          ? (obj["price"] as number)
          : 0;
      const status =
        typeof obj["status"] === "number"
          ? (obj["status"] as number)
          : RoomStatus.Available;
      const tenantId =
        typeof obj["tenantId"] === "string" ? (obj["tenantId"] as string) : "";
      const tenantName =
        typeof obj["tenantName"] === "string"
          ? (obj["tenantName"] as string)
          : "";
      const capacity =
        typeof obj["capacity"] === "number" ? (obj["capacity"] as number) : 2;
      const created =
        typeof obj["created"] === "string"
          ? (obj["created"] as string)
          : String(obj["createdAt"] ?? "");
      const updated =
        typeof obj["updated"] === "string"
          ? (obj["updated"] as string)
          : String(obj["updatedAt"] ?? "");

      return {
        id,
        number: roomNumber,
        roomNumber,
        roomTypeId,
        roomTypeName,
        roomTypePrice,
        status,
        tenantId,
        tenantName,
        type: roomTypeName,
        capacity,
        created,
        updated,
      } as Room;
    });
  }

  return data as Room[];
};

// Get room by ID
export const getRoomById = async (id: string): Promise<Room> => {
  const response = await fetch(`/api/rooms/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Error fetching room: ${response.status} ${response.statusText} - ${body}`
    );
  }

  const obj = (await response.json()) as Record<string, unknown>;
  const idVal =
    typeof obj["id"] === "string"
      ? (obj["id"] as string)
      : String(obj["id"] ?? "");
  const roomNumber =
    typeof obj["roomNumber"] === "string"
      ? (obj["roomNumber"] as string)
      : typeof obj["number"] === "string"
      ? (obj["number"] as string)
      : idVal;

  return {
    id: idVal,
    number: roomNumber,
    roomNumber,
    roomTypeId:
      typeof obj["roomTypeId"] === "string"
        ? (obj["roomTypeId"] as string)
        : "",
    roomTypeName:
      typeof obj["roomTypeName"] === "string"
        ? (obj["roomTypeName"] as string)
        : "",
    roomTypePrice:
      typeof obj["roomTypePrice"] === "number"
        ? (obj["roomTypePrice"] as number)
        : 0,
    status:
      typeof obj["status"] === "number"
        ? (obj["status"] as number)
        : RoomStatus.Available,
    tenantId:
      typeof obj["tenantId"] === "string" ? (obj["tenantId"] as string) : "",
    tenantName:
      typeof obj["tenantName"] === "string"
        ? (obj["tenantName"] as string)
        : "",
    type:
      typeof obj["type"] === "string"
        ? (obj["type"] as string)
        : typeof obj["roomTypeName"] === "string"
        ? (obj["roomTypeName"] as string)
        : "",
    capacity:
      typeof obj["capacity"] === "number" ? (obj["capacity"] as number) : 2,
    created:
      typeof obj["created"] === "string"
        ? (obj["created"] as string)
        : String(obj["createdAt"] ?? ""),
    updated:
      typeof obj["updated"] === "string"
        ? (obj["updated"] as string)
        : String(obj["updatedAt"] ?? ""),
  };
};
