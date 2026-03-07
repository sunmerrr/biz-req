import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requests, comments, messages } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { log } from "@/lib/logger";
import { eq, desc } from "drizzle-orm";

// GET /api/requests/[requestId] — 요청 상세 (biz + plan 모두 접근)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const role = await getAuthRole();
  if (!role) {
    return apiError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const { requestId } = await params;

  const [req] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));

  if (!req) {
    return apiError(404, "NOT_FOUND", "요청을 찾을 수 없습니다.");
  }

  const commentList = await db
    .select()
    .from(comments)
    .where(eq(comments.requestId, requestId))
    .orderBy(desc(comments.createdAt));

  return NextResponse.json({ request: req, comments: commentList, role });
}

// PATCH /api/requests/[requestId] — 제목 변경 (biz 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const role = await getAuthRole();
  if (role !== "biz") {
    return apiError(403, "FORBIDDEN", "사업팀만 수정할 수 있습니다.");
  }

  const { requestId } = await params;

  const [req] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));

  if (!req) {
    return apiError(404, "NOT_FOUND", "요청을 찾을 수 없습니다.");
  }

  try {
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return apiError(400, "INVALID_INPUT", "제목을 입력해주세요.");
    }

    const [updated] = await db
      .update(requests)
      .set({ title: title.trim(), updatedAt: new Date() })
      .where(eq(requests.id, requestId))
      .returning();

    log("info", "요청 제목 변경", { requestId, title: title.trim() });

    return NextResponse.json(updated);
  } catch {
    return apiError(400, "INVALID_INPUT", "잘못된 요청입니다.");
  }
}

// DELETE /api/requests/[requestId] — 요청 삭제 (biz 전용)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const role = await getAuthRole();
  if (role !== "biz") {
    return apiError(403, "FORBIDDEN", "사업팀만 삭제할 수 있습니다.");
  }

  const { requestId } = await params;

  const [req] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));

  if (!req) {
    return apiError(404, "NOT_FOUND", "요청을 찾을 수 없습니다.");
  }

  // 댓글 → 메시지 → 요청 순으로 삭제 (FK 제약)
  await db.delete(comments).where(eq(comments.requestId, requestId));
  await db.delete(messages).where(eq(messages.requestId, requestId));
  await db.delete(requests).where(eq(requests.id, requestId));

  log("info", "요청 삭제", { requestId, title: req.title });

  return NextResponse.json({ success: true });
}
