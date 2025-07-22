// src/utils/professionService.ts

export interface Profession {
  id: string;
  name: string;
}

export interface CreateProfessionDto {
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

// Create a new profession
export const createProfession = async (
  data: CreateProfessionDto
): Promise<Profession> => {
  try {
    const response = await fetch(`/api/professions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Error creating profession: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating profession:", error);
    throw error;
  }
};
