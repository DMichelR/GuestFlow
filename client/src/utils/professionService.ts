// src/utils/professionService.ts

export interface Profession {
  id: string;
  name: string;
}

// Get all professions
export const getAllProfessions = async (): Promise<Profession[]> => {
  try {
    const response = await fetch(`/api/professions`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching professions: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching professions:", error);
    return []; // Retornar array vacío en caso de error
  }
};
