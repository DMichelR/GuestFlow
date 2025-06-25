// src/utils/companyService.ts

export interface Company {
  id: string;
  name: string;
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

export interface CreateCompanyDto {
  name: string;
}

// Create a new company
export const createCompany = async (
  companyData: CreateCompanyDto
): Promise<Company> => {
  const response = await fetch(`/api/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(companyData),
  });

  if (!response.ok) {
    throw new Error(`Error creating company: ${response.status}`);
  }

  return await response.json();
};
