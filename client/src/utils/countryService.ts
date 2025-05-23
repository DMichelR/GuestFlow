// src/utils/countryService.ts

export interface Country {
  id: string;
  name: string;
}

// Get all countries
export const getAllCountries = async (): Promise<Country[]> => {
  try {
    const response = await fetch(`/api/countries`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching countries: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching countries:", error);
    return []; // Retornar array vacío en caso de error
  }
};
