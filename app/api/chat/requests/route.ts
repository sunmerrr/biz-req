import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requests } from "@/lib/schema";
import { getAuthRole } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { desc } from "drizzle-orm";

// GET /api/chat/requests — 모든 요청 목록 (최신순, prototype_html 제외)
export async function GET() {
  const role = await getAuthRole();
  if (role !== "biz") {
    return apiError(403, "FORBIDDEN", "사업팀만 접근할 수 있습니다.");
  }

  const rows = await db
    .select({
      id: requests.id,
      title: requests.title,
      status: requests.status,
      createdAt: requests.createdAt,
      updatedAt: requests.updatedAt,
    })
    .from(requests)
    .orderBy(desc(requests.createdAt));

  return NextResponse.json(rows);
}
