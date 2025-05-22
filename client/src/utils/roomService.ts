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
  number: string;
  roomTypeId: string;
  roomTypeName: string;
  roomTypePrice: number;
  status: RoomStatus;
  tenantId: string;
  tenantName: string;
  created: string;
  updated: string;
}

// Get all available rooms
export const getAvailableRooms = async (): Promise<Room[]> => {
  const response = await fetch(`/api/rooms/available`, {
    headers: {
      "Content-Type": "application/json",
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
