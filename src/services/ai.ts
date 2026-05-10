import { GoogleGenAI, Type } from "@google/genai";
import { Mood, StudentType, Task, AiRecommendation, HistoryEntry, WhatIfResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getRecommendation(
  tasks: Task[], 
  mood: Mood, 
  studentType: StudentType,
  history: HistoryEntry[] = [],
  options: { easierMode?: boolean } = {}
): Promise<AiRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment.");
  }

  const taskList = tasks.map(t => `- ${t.text}${t.deadline ? ` (Deadline: ${t.deadline})` : ''}`).join('\n');
  const historyContext = history
    .filter(h => h && h.taskName)
    .slice(-20)
    .map(h => `- ${h.taskName}: ${h.completed ? 'COMPLETED' : 'SKIPPED'} at ${h.timeOfDay || 'unknown'}:00h (${h.mood})`)
    .join('\n');

  const prompt = `
    You are an AI Life Copilot for students.
    
    Status:
    - Student Type: ${studentType}
    - Current Mood: ${mood}
    - Mode: ${options.easierMode ? 'LOW ENERGY / EASIER VERSION requested' : 'Standard Priority'}
    
    Behavioral History (Past 20 entries):
    ${historyContext || 'No history yet.'}
    
    Tasks:
    ${taskList}
    
    Requirements:
    1. Analyze history: If the user often skips certain tasks at this time or mood, adjust.
    2. Suggest priorityTask, nextAction (very specific), backupTask, and reason.
    3. If easierMode is true, suggest a very low-effort version of the priority task (e.g., skip deep work, do admin/review).
    4. Provide confidence metrics (0-100 score, urgency/energyMatch/impact as strings).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityTask: { type: Type.STRING },
            nextAction: { type: Type.STRING },
            backupTask: { type: Type.STRING },
            reason: { type: Type.STRING },
            confidence: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                urgency: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                energyMatch: { type: Type.STRING, enum: ['good', 'average', 'poor'] },
                impact: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
              },
              required: ["score", "urgency", "energyMatch", "impact"]
            }
          },
          required: ["priorityTask", "nextAction", "backupTask", "reason", "confidence"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      console.error("AI Response candidates:", response);
      throw new Error("No response text from AI. Check safety filters or model availability.");
    }
    
    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error in getRecommendation:", error);
    throw error;
  }
}

export async function getWhatIfConsequences(
  task: string, 
  studentType: StudentType
): Promise<WhatIfResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment.");
  }

  const prompt = `
    Analyze the consequences for a ${studentType} student if they SKIP the task: "${task}".
    Provide a realistic short-term consequence and a long-term impact.
    Keep it direct and impactful.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortTerm: { type: Type.STRING },
            longTerm: { type: Type.STRING }
          },
          required: ["shortTerm", "longTerm"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      console.error("AI Response candidates (WhatIf):", response);
      throw new Error("No response from AI");
    }
    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error in getWhatIfConsequences:", error);
    throw error;
  }
}
