import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requests } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { generatePrototype } from "@/lib/ai";
import { log } from "@/lib/logger";
import { saveVersion } from "@/lib/versions";
import { eq } from "drizzle-orm";

// POST /api/chat/[requestId]/prototype — 프로토타입 HTML 생성
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const role = await getAuthRole();
  if (role !== "biz") {
    return apiError(403, "FORBIDDEN", "사업팀만 접근할 수 있습니다.");
  }

  const rl = checkRateLimit("prototype");
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

  if (req.status !== "proto_generating" && req.status !== "completed") {
    return apiError(400, "INVALID_STATUS", "요구사항 문서가 먼저 생성되어야 합니다.");
  }

  if (!req.requirementDoc) {
    return apiError(400, "INVALID_STATUS", "요구사항 문서가 없습니다.");
  }

  const previousStatus = req.status;

  try {
    // completed 상태에서 진입 시 proto_generating으로 전환
    if (req.status === "completed") {
      await db.update(requests)
        .set({ status: "proto_generating", updatedAt: new Date() })
        .where(eq(requests.id, requestId));
    }

    const html = await generatePrototype(req.requirementDoc);

    await db.update(requests)
      .set({
        prototypeHtml: html,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(requests.id, requestId));

    let version: number | undefined;
    try {
      version = await saveVersion(requestId, "prototype", html);
    } catch (e) {
      log("error", "버전 저장 실패", { requestId, error: String(e) });
    }

    log("info", "프로토타입 생성 완료", { requestId });

    return NextResponse.json({ status: "completed", version });
  } catch (error) {
    // Rollback to previous status so user can retry
    await db.update(requests)
      .set({ status: previousStatus, updatedAt: new Date() })
      .where(eq(requests.id, requestId));

    log("error", "프로토타입 생성 실패", {
      requestId,
      error: String(error),
    });
    return apiError(500, "GENERATION_FAILED", "프로토타입 생성에 실패했습니다.");
  }
}
