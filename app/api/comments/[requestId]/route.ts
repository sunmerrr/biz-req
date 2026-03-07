import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, requests } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { log } from "@/lib/logger";
import { eq } from "drizzle-orm";

// POST /api/comments/[requestId] — 코멘트 추가 (biz + plan 모두 가능)
export async function POST(
  request: NextRequest,
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

  try {
    const body = await request.json();
    const { content, parentId } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return apiError(400, "INVALID_INPUT", "코멘트 내용을 입력해주세요.");
    }

    // 대댓글인 경우 부모 댓글 검증 (1단만 허용)
    if (parentId != null) {
      const [parent] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, parentId));

      if (!parent) {
        return apiError(404, "NOT_FOUND", "부모 댓글을 찾을 수 없습니다.");
      }
      if (parent.parentId != null) {
        return apiError(400, "INVALID_INPUT", "대댓글에는 답글을 달 수 없습니다.");
      }
    }

    const now = new Date();
    const [result] = await db
      .insert(comments)
      .values({
        requestId,
        parentId: parentId ?? null,
        role,
        content: content.trim(),
        createdAt: now,
      })
      .returning();

    log("info", "코멘트 추가", { requestId, commentId: result.id });

    return NextResponse.json(result, { status: 201 });
  } catch {
    return apiError(400, "INVALID_INPUT", "잘못된 요청입니다.");
  }
}
