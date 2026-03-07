import { NextResponse } from "next/server";

export type ErrorCode =
  | "INVALID_INPUT"
  | "INVALID_STATUS"
  | "UNAUTHORIZED"
  | "INVALID_TEAM_CODE"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "GENERATION_FAILED"
  | "INTERNAL_ERROR";

export function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown
) {
  const error: Record<string, unknown> = { code, message };
  if (details) {
    error.details = details;
  }
  return NextResponse.json({ error }, { status });
}
