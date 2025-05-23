// src/utils/guestService.ts

export interface Guest {
  id: string;
  name: string;
  lastName: string;
  cid: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  tenantId: string;
  professionId?: string;
  cityId: string;
  countryId: string;
}

export interface CreateGuestDto {
  name: string;
  lastName: string;
  cid: string;
  birthday: string;
  email: string;
  phone: string;
  address: string;
  professionId?: string | null;
  cityId: string;
  countryId: string;
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
  const response = await fetch(`/api/guest-create`, {
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
