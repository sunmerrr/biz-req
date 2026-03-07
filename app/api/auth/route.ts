import { NextRequest, NextResponse } from "next/server";
import { signCookie, AUTH_COOKIE_NAME, type Role } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

const TEAM_CODES: Record<string, Role> = {
  biz: "biz",
  plan: "plan",
};

export async function POST(request: NextRequest) {
  // Rate limit
  const rl = checkRateLimit("auth");
  if (!rl.allowed) {
    return apiError(429, "RATE_LIMIT_EXCEEDED", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return apiError(400, "INVALID_INPUT", "팀 코드를 입력해주세요.");
    }

    const role = TEAM_CODES[code.trim().toLowerCase()];
    if (!role) {
      return apiError(401, "INVALID_TEAM_CODE", "유효하지 않은 팀 코드입니다.");
    }

    const signedCookie = signCookie(role);

    const response = NextResponse.json({ role });
    response.cookies.set(AUTH_COOKIE_NAME, signedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 604800, // 7 days
      path: "/",
    });

    log("info", "로그인 성공", { role });
    return response;
  } catch {
    return apiError(400, "INVALID_INPUT", "잘못된 요청입니다.");
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  log("info", "로그아웃");
  return response;
}
