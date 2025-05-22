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
