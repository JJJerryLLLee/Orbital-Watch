import { GoogleGenAI, Type } from "@google/genai";
import { SatelliteData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSatelliteDetails = async (satellite: SatelliteData): Promise<string> => {
  try {
    const prompt = `
      Generate a short, realistic, but fictional technical description for a satellite with the following parameters:
      Owner: ${satellite.company} (${satellite.country})
      Type: ${satellite.type}
      Orbit Altitude: ~${satellite.altitude.toFixed(0)} km

      Provide a 2-3 sentence summary describing its specific mission (e.g., telecommunications, spy reconnaissance, weather monitoring, scientific research) and its hypothetical launch year.
      Make it sound scientific and professional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster response
      }
    });

    return response.text || "Data transmission interrupted. Unable to retrieve classified details.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection to satellite database failed.";
  }
};
