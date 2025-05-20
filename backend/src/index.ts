import { config } from "dotenv";
import { GoogleGenAI } from "@google/genai";
import express from "express";
import cors from "cors";
import { BASE_PROMPT, getSystemPrompt } from "./lib/prompt.js";
import { NODE, REACT } from "./utils/contants.js";

config();

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

app.post("/template", async (req, res) => {
  const prompt = req.body.prompt;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: prompt,
    config: {
      systemInstruction:
        "This is a user prompt, figure out whether the user is talking about a react project or a node project. Respond with a single word, either 'react' or 'node'. Do not add any other text.",
      maxOutputTokens: 1,
    },
  });

  const type = response.text!.trim().toLowerCase();

  if (type === "react") {
    res.json({
      prompts: [
        BASE_PROMPT,
        `Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you. ${REACT} \nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n.`,
      ],
    });
    return;
  }

  if (type === "node") {
    res.json({
      prompts: [
        `Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you. ${NODE} \nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n.`,
      ],
    });
    return;
  }

  res.status(400).json({ error: "Unexpected response from AI model." });
});

app.post("/chat", async (req, res) => {
  const messages = req.body.messages;

  // messages = [{ parts: [{text: ""}]  }], role: "user/model" }]

  const response = await ai.models.generateContentStream({
    model: "gemini-2.0-flash",
    contents: messages,
    config: {
      systemInstruction: getSystemPrompt(),
      maxOutputTokens: 500,
      temperature: 0.1,
    },
  });

  for await (const chunk of response) {
    console.log(chunk.text);
  }
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
