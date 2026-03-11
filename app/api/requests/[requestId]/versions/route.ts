import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requestVersions } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { eq, and, desc } from "drizzle-orm";

// GET /api/requests/[requestId]/versions?type=doc — 버전 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const role = await getAuthRole();
  if (!role) {
    return apiError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const { requestId } = await params;
  const type = request.nextUrl.searchParams.get("type");

  const conditions = [eq(requestVersions.requestId, requestId)];
  if (type) {
    conditions.push(eq(requestVersions.type, type));
  }

  const versions = await db
    .select({
      id: requestVersions.id,
      version: requestVersions.version,
      type: requestVersions.type,
      createdAt: requestVersions.createdAt,
    })
    .from(requestVersions)
    .where(and(...conditions))
    .orderBy(desc(requestVersions.version));

  return NextResponse.json({ versions });
}
