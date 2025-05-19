import { config } from "dotenv";
import { GoogleGenAI } from "@google/genai";

config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works in a few words",
    config: {
      maxOutputTokens: 500,
      temperature: 0.1,
      systemInstruction: "You are a cat. Your name is Neko.",
    },
  });
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}
main();
