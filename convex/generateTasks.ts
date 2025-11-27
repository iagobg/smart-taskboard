import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { api } from "./_generated/api";

export const generate = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
    });

    const fullPrompt = `Generate 5–12 actionable tasks for this goal: "${prompt}". 
Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
[{"title": "string", "description": "optional string"}]`;

    const result = await model.generateContent(fullPrompt);

    let tasks;
    try {
      tasks = JSON.parse(result.response.text());
    } catch (e) {
      throw new Error("Gemini returned invalid JSON");
    }

    if (!Array.isArray(tasks)) throw new Error("Invalid response format");

    for (const task of tasks) {
      if (typeof task.title === "string") {
        await ctx.runMutation(api.tasks.add, {
          title: task.title,
          description: task.description ?? "",
        });
      }
    }
  },
});