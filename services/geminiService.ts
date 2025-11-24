import { GoogleGenAI } from "@google/genai";
import { SatelliteData } from '../types';

export const getSatelliteDetails = async (satellite: SatelliteData, apiKey: string): Promise<string> => {
  if (!apiKey) {
    return "Please configure your Google Gemini API Key in the settings (bottom right) to enable AI analysis.";
  }

  try {
    // Initialize the AI client dynamically with the user-provided key
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `
      Provide a factual technical summary for the real satellite named "${satellite.name}".
      
      Context details:
      - Owner: ${satellite.company} (${satellite.country})
      - Type: ${satellite.type}
      - Orbit: ~${satellite.altitude.toFixed(0)} km altitude

      If this is a generic member of a constellation (like "Starlink-3120"), describe the general mission and capabilities of that constellation.
      If this is a specific famous satellite (like "Hubble" or "ISS"), provide specific details about its current status and key achievements.
      
      Keep the response professional, scientific, and under 80 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    return response.text || "Data transmission interrupted. Unable to retrieve classified details.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection to satellite database failed. Please check your API Key.";
  }
};