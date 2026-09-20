import { GoogleGenerativeAI } from "@google/generative-ai";

const PRIMARY_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const FALLBACK_KEY = "YOUR_API_KEY_HERE";

if (!PRIMARY_KEY) {
  console.warn("VITE_GEMINI_API_KEY is not defined in .env.local! Using fallback key.");
}

const SYSTEM_INSTRUCTION = "You are WeatherGPT, a highly knowledgeable and friendly AI assistant specialized in meteorology, climate patterns, and weather alerts. Answer questions clearly and accurately. Keep your answers very short, concise, and straight to the point. Do not add unnecessary fluff. You can use markdown.";


function createModel(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });
}

export const model = createModel(PRIMARY_KEY || FALLBACK_KEY);
export const fallbackModel = createModel(FALLBACK_KEY);
