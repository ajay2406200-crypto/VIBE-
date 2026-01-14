
import { GoogleGenAI, Type } from "@google/genai";
import { MoodType } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMoodQuote = async (mood: MoodType): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, edgy, and emotional one-liner lyric or quote for someone feeling "${mood}". Keep it underground and poetic. No hashtags.`,
    });
    return response.text || "Find your listener – feel that from your music";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Shor ke liye nahi, sukoon ke liye.";
  }
};

export const suggestUndergroundArtists = async (mood: MoodType): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `List 5 fictional names for independent, underground musical artists that fit a "${mood}" vibe. Return as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return ["Void Walker", "Silent Echo", "The Unseen", "Static Soul", "Digital Nomad"];
  }
};
