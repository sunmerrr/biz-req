import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requests, messages } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateRequirementDoc } from "@/lib/ai";
import { log } from "@/lib/logger";
import { eq } from "drizzle-orm";

// POST /api/chat/[requestId]/complete — 요구사항 문서 생성
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const role = await getAuthRole();
  if (role !== "biz") {
    return apiError(403, "FORBIDDEN", "사업팀만 접근할 수 있습니다.");
  }

  const rl = checkRateLimit("complete");
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

  if (req.status !== "chatting" && req.status !== "completed") {
    return apiError(400, "INVALID_STATUS", "현재 생성 중입니다. 잠시 기다려주세요.");
  }

  const previousStatus = req.status;

  try {
    // Update status to generating
    await db.update(requests)
      .set({ status: "doc_generating", updatedAt: new Date() })
      .where(eq(requests.id, requestId));

    // Get conversation
    const msgs = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.requestId, requestId));

    const conversationText = msgs
      .map((m) => `${m.role === "assistant" ? "AI" : "사용자"}: ${m.content}`)
      .join("\n\n");

    // Generate requirement doc
    const doc = await generateRequirementDoc(conversationText);

    await db.update(requests)
      .set({
        requirementDoc: doc,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(requests.id, requestId));

    log("info", "요구사항 문서 생성 완료", { requestId });

    return NextResponse.json({ requirementDoc: doc, status: "completed" });
  } catch (error) {
    // Rollback status
    await db.update(requests)
      .set({ status: previousStatus, updatedAt: new Date() })
      .where(eq(requests.id, requestId));

    log("error", "요구사항 문서 생성 실패", {
      requestId,
      error: String(error),
    });
    return apiError(500, "GENERATION_FAILED", "요구사항 문서 생성에 실패했습니다.");
  }
}
