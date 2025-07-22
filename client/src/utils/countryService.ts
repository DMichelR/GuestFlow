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

    const countries = await response.json();
    // Ordenar los países alfabéticamente por nombre
    return countries.sort((a: Country, b: Country) =>
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error("Error fetching countries:", error);
    return []; // Retornar array vacío en caso de error
  }
};
