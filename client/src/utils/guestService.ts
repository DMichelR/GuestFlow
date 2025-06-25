// src/utils/guestService.ts

export interface Guest {
  id: string;
  name: string;
  lastName: string;
  fullName: string;
  cid: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  tenantId: string;
  professionId?: string;
  professionName?: string;
  cityId: string;
  cityName: string;
  countryId: string;
  countryName: string;
}

export interface CreateGuestDto {
  name: string;
  lastName: string;
  cid: string;
  birthday: string; // Will be converted to ISO format when sending to API
  email: string;
  phone: string;
  address: string;
  professionId?: string | null;
  cityId: string;
  countryId: string;
}

export interface UpdateGuestDto {
  name?: string;
  lastName?: string;
  cid?: string;
  birthday?: string;
  email?: string;
  phone?: string;
  address?: string;
  professionId?: string | null;
  cityId?: string;
  countryId?: string;
}

// Get all guests
export const getAllGuests = async (): Promise<Guest[]> => {
  const response = await fetch(`/api/guests`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching guests: ${response.status}`);
  }

  return await response.json();
};

// Get guest by ID
export const getGuestById = async (id: string): Promise<Guest> => {
  const response = await fetch(`/api/guests/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching guest: ${response.status}`);
  }

  return await response.json();
};

// Create new guest
export const createGuest = async (data: CreateGuestDto): Promise<Guest> => {
  const response = await fetch(`/api/guests/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error creating guest: ${response.status}`);
  }

  return await response.json();
};

// Update guest
export const updateGuest = async (
  id: string,
  data: UpdateGuestDto
): Promise<Guest> => {
  const response = await fetch(`/api/guests/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error updating guest: ${response.status}`);
  }

  return await response.json();
};

// Delete guest
export const deleteGuest = async (id: string): Promise<void> => {
  const response = await fetch(`/api/guests/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error deleting guest: ${response.status}`);
  }
};
