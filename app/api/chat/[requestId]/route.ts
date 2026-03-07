import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requests, messages } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { chat } from "@/lib/ai";
import { log } from "@/lib/logger";
import { eq } from "drizzle-orm";

// GET /api/chat/[requestId] — 메시지 목록
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const role = await getAuthRole();
  if (role !== "biz") {
    return apiError(403, "FORBIDDEN", "사업팀만 접근할 수 있습니다.");
  }

  const { requestId } = await params;

  const [req] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));

  if (!req) {
    return apiError(404, "NOT_FOUND", "요청을 찾을 수 없습니다.");
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.requestId, requestId));

  return NextResponse.json({ request: req, messages: msgs });
}

// POST /api/chat/[requestId] — 메시지 전송
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const role = await getAuthRole();
  if (role !== "biz") {
    return apiError(403, "FORBIDDEN", "사업팀만 접근할 수 있습니다.");
  }

  const rl = checkRateLimit("chat");
  if (!rl.allowed) {
    return apiError(429, "RATE_LIMIT_EXCEEDED", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
  }

  const { requestId } = await params;

  const [req] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));

  if (!req) {
    return apiError(404, "NOT_FOUND", "요청을 찾을 수 없습니다.");
  }

  if (req.status !== "chatting") {
    // 완료된 요청은 자동으로 chatting으로 복귀
    if (req.status === "completed") {
      await db.update(requests)
        .set({ status: "chatting", updatedAt: new Date() })
        .where(eq(requests.id, requestId));
    } else {
      return apiError(400, "INVALID_STATUS", "현재 생성 중입니다. 잠시 기다려주세요.");
    }
  }

  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return apiError(400, "INVALID_INPUT", "메시지를 입력해주세요.");
    }

    const now = new Date();

    // Save user message
    await db.insert(messages)
      .values({
        requestId,
        role: "user",
        content: message.trim(),
        createdAt: now,
      });

    // Get history
    const history = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.requestId, requestId));

    // Generate AI response
    const aiResponse = await chat(
      history.slice(0, -1), // exclude the message we just added (it's the userMessage)
      message.trim()
    );

    // Save AI response
    await db.insert(messages)
      .values({
        requestId,
        role: "assistant",
        content: aiResponse,
        createdAt: new Date(),
      });

    // Update title from first user message if still default
    if (req.title === "새 요구사항") {
      const title =
        message.trim().length > 50
          ? message.trim().slice(0, 50) + "..."
          : message.trim();
      await db.update(requests)
        .set({ title, updatedAt: new Date() })
        .where(eq(requests.id, requestId));
    } else {
      await db.update(requests)
        .set({ updatedAt: new Date() })
        .where(eq(requests.id, requestId));
    }

    log("info", "채팅 메시지 처리", { requestId });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    log("error", "채팅 실패", { requestId, error: String(error) });
    return apiError(500, "GENERATION_FAILED", "AI 응답 생성에 실패했습니다.");
  }
}
