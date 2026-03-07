import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requests, comments } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { desc, eq, count } from "drizzle-orm";

// GET /api/requests — 완료된 요청 목록 (plan 전용, 코멘트 수 포함)
export async function GET() {
  const role = await getAuthRole();
  if (role !== "plan") {
    return apiError(403, "FORBIDDEN", "기획자만 접근할 수 있습니다.");
  }

  const rows = await db
    .select({
      id: requests.id,
      title: requests.title,
      status: requests.status,
      createdAt: requests.createdAt,
      updatedAt: requests.updatedAt,
      commentCount: count(comments.id),
    })
    .from(requests)
    .leftJoin(comments, eq(requests.id, comments.requestId))
    .where(eq(requests.status, "completed"))
    .groupBy(requests.id)
    .orderBy(desc(requests.createdAt));

  return NextResponse.json(rows);
}
