// src/utils/visitReasonService.ts

export interface VisitReason {
  id: string;
  name: string;
  tenantId: string;
  created: string;
  updated: string;
}

// Get all visit reasons
export const getAllVisitReasons = async (): Promise<VisitReason[]> => {
  const response = await fetch(`/api/visit-reasons`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching visit reasons: ${response.status}`);
  }

  return await response.json();
};

// Create a new visit reason
export const createVisitReason = async (name: string): Promise<VisitReason> => {
  const response = await fetch(`/api/visit-reasons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`Error creating visit reason: ${response.status}`);
  }

  return await response.json();
};

// Update a visit reason
export const updateVisitReason = async (
  id: string,
  name: string
): Promise<VisitReason> => {
  const response = await fetch(`/api/visit-reasons/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`Error updating visit reason: ${response.status}`);
  }

  return await response.json();
};

// Delete a visit reason
export const deleteVisitReason = async (id: string): Promise<void> => {
  const response = await fetch(`/api/visit-reasons/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error deleting visit reason: ${response.status}`);
  }
};
