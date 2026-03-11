import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requestVersions } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { eq, and } from "drizzle-orm";

// GET /api/requests/[requestId]/versions/[versionId] — 특정 버전 콘텐츠 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string; versionId: string }> }
) {
  const role = await getAuthRole();
  if (!role) {
    return apiError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const { requestId, versionId } = await params;
  const id = parseInt(versionId, 10);

  if (isNaN(id)) {
    return apiError(400, "INVALID_INPUT", "잘못된 버전 ID입니다.");
  }

  const [version] = await db
    .select()
    .from(requestVersions)
    .where(
      and(
        eq(requestVersions.id, id),
        eq(requestVersions.requestId, requestId)
      )
    );

  if (!version) {
    return apiError(404, "NOT_FOUND", "버전을 찾을 수 없습니다.");
  }

  return NextResponse.json({ version });
}
