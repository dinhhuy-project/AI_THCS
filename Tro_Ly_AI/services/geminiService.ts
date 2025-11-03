import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function createChatSession(): Chat {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    },
  });
}