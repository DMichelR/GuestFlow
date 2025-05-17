// src/utils/tenantService.ts

// Interfaces
export interface Tenant {
  id: string;
  name: string;
  created: string;
  updated: string;
}

export interface CreateTenantDto {
  name: string;
}

// Obtener todos los tenants
export const getAllTenants = async (): Promise<Tenant[]> => {
  const response = await fetch(`/api/tenant-list`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching tenants: ${response.status}`);
  }

  return await response.json();
};

// Crear un nuevo tenant
export const createTenant = async (data: CreateTenantDto): Promise<Tenant> => {
  const response = await fetch(`/api/tenant-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error creating tenant: ${response.status}`);
  }

  return await response.json();
};
