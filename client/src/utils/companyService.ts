// src/utils/companyService.ts

export interface Company {
  id: string;
  name: string;
  ruc: string;
  email: string;
  phone: string;
  address: string;
  tenantId: string;
}

// Get all companies
export const getAllCompanies = async (): Promise<Company[]> => {
  const response = await fetch(`/api/companies`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching companies: ${response.status}`);
  }

  return await response.json();
};
