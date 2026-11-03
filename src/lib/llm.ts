import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { logger } from "./logger";

export function getModelName() {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

export function getModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const llm = createOpenAI({ apiKey, baseURL: "https://api.openai.com/v1" });
  return llm.chat(getModelName());
}

export async function llmGenerateJson(
  prompt: string,
  opts?: { system?: string; temperature?: number; maxOutputTokens?: number },
): Promise<Record<string, unknown> | null> {
  try {
    const result = await generateText({
      model: getModel(),
      system: opts?.system,
      prompt,
      temperature: opts?.temperature ?? 0.7,
      maxOutputTokens: opts?.maxOutputTokens ?? 800,
    });
    let raw = result.text.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    return JSON.parse(raw);
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "llmGenerateJson failed");
    return null;
  }
}
