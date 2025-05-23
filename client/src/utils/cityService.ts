// src/utils/cityService.ts

export interface City {
  id: string;
  name: string;
}

// Get all cities
export const getAllCities = async (): Promise<City[]> => {
  try {
    const response = await fetch(`/api/cities`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching cities: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching cities:", error);
    return []; // Retornar array vacío en caso de error
  }
};

// Get cities by country ID
export const getCitiesByCountry = async (
  countryId: string
): Promise<City[]> => {
  try {
    const response = await fetch(`/api/cities?countryId=${countryId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching cities: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching cities by country:", error);
    return []; // Retornar array vacío en caso de error
  }
};
