import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requests, messages } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { log } from "@/lib/logger";

// POST /api/chat — 새 요청 생성 + 첫 AI 인사 메시지
export async function POST() {
  const role = await getAuthRole();
  if (role !== "biz") {
    return apiError(403, "FORBIDDEN", "사업팀만 접근할 수 있습니다.");
  }

  try {
    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(requests)
      .values({
        id,
        title: "새 요구사항",
        status: "chatting",
        createdAt: now,
        updatedAt: now,
      });

    const greeting =
      "안녕하세요! 사업팀 요구사항 정리를 도와드리겠습니다.\n\n어떤 서비스나 기능을 만들고 싶으신가요? 간단하게 설명해주시면 제가 구체적인 질문을 통해 요구사항을 정리해드리겠습니다.";

    await db.insert(messages)
      .values({
        requestId: id,
        role: "assistant",
        content: greeting,
        createdAt: now,
      });

    log("info", "새 요청 생성", { requestId: id });

    return NextResponse.json({ id, greeting }, { status: 201 });
  } catch (error) {
    log("error", "요청 생성 실패", { error: String(error) });
    return apiError(500, "INTERNAL_ERROR", "요청 생성에 실패했습니다.");
  }
}
