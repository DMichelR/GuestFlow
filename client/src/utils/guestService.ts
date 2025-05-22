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
