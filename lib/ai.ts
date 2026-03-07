import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { apiUsage } from "./schema";
import { and, eq } from "drizzle-orm";
import {
  chatSystemPrompt,
  requirementDocPrompt,
  prototypePrompt,
} from "./prompts";
import { log } from "./logger";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
      log("warn", "API 503 에러, 3초 후 재시도", { error: msg });
      await new Promise((r) => setTimeout(r, 3000));
      return await fn();
    }
    throw error;
  }
}

const FLASH_MODEL = "gemini-2.5-flash";
const FLASH_LITE_MODEL = "gemini-2.5-flash-lite";
const FLASH_DAILY_LIMIT = 240;
const FLASH_LITE_DAILY_LIMIT = 980;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getUsageCount(model: string): Promise<number> {
  const today = todayStr();
  const [row] = await db
    .select()
    .from(apiUsage)
    .where(and(eq(apiUsage.date, today), eq(apiUsage.model, model)));
  return row?.count ?? 0;
}

export async function getModelName(): Promise<string> {
  const flashCount = await getUsageCount(FLASH_MODEL);
  if (flashCount < FLASH_DAILY_LIMIT) {
    return FLASH_MODEL;
  }

  const liteCount = await getUsageCount(FLASH_LITE_MODEL);
  if (liteCount < FLASH_LITE_DAILY_LIMIT) {
    log("info", "Flash 한도 초과, Flash-Lite로 전환", {
      flashCount,
      liteCount,
    });
    return FLASH_LITE_MODEL;
  }

  throw new Error("일일 API 한도를 모두 소진했습니다.");
}

async function recordUsage(modelName: string): Promise<void> {
  const today = todayStr();
  const [existing] = await db
    .select()
    .from(apiUsage)
    .where(and(eq(apiUsage.date, today), eq(apiUsage.model, modelName)));

  if (existing) {
    await db.update(apiUsage)
      .set({ count: existing.count + 1 })
      .where(eq(apiUsage.id, existing.id));
  } else {
    await db.insert(apiUsage)
      .values({ date: today, model: modelName, count: 1 });
  }
}

export async function chat(
  history: { role: string; content: string }[],
  userMessage: string
): Promise<string> {
  const modelName = await getModelName();
  const startTime = Date.now();

  const formattedHistory = history.map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.content }],
  }));

  const chatSession = ai.chats.create({
    model: modelName,
    config: { systemInstruction: chatSystemPrompt },
    history: formattedHistory,
  });

  const response = await withRetry(() => chatSession.sendMessage({ message: userMessage }));
  await recordUsage(modelName);

  log("info", "채팅 응답 생성", {
    model: modelName,
    durationMs: Date.now() - startTime,
  });

  return response.text ?? "";
}

export async function generateRequirementDoc(
  conversationText: string
): Promise<string> {
  const modelName = await getModelName();
  const startTime = Date.now();

  const response = await withRetry(() => ai.models.generateContent({
    model: modelName,
    contents: conversationText,
    config: { systemInstruction: requirementDocPrompt },
  }));

  await recordUsage(modelName);

  log("info", "요구사항 문서 생성", {
    model: modelName,
    durationMs: Date.now() - startTime,
  });

  return response.text ?? "";
}

export async function generatePrototype(
  requirementDoc: string
): Promise<string> {
  const modelName = await getModelName();
  const startTime = Date.now();

  const response = await withRetry(() => ai.models.generateContent({
    model: modelName,
    contents: requirementDoc,
    config: { systemInstruction: prototypePrompt },
  }));

  await recordUsage(modelName);

  log("info", "프로토타입 HTML 생성", {
    model: modelName,
    durationMs: Date.now() - startTime,
  });

  const text = response.text ?? "";

  // Strip HTML code block markers
  const htmlMatch = text.match(/```html\s*([\s\S]*?)```/);
  if (htmlMatch) {
    return htmlMatch[1].trim();
  }

  // If no code block, return as-is (might already be raw HTML)
  return text.trim();
}
