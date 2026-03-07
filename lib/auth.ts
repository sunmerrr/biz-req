import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bizreq_auth";
const HMAC_SECRET = process.env.HMAC_SECRET || "dev-secret-key-change-me";

export type Role = "biz" | "plan";

export function signCookie(role: Role): string {
  const payload = `${role}`;
  const signature = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function verifyCookie(
  cookieValue: string
): { valid: true; role: Role } | { valid: false; role: null } {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return { valid: false, role: null };

  const [payload, signature] = parts;
  const role = payload as Role;

  if (role !== "biz" && role !== "plan") {
    return { valid: false, role: null };
  }

  const expected = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(payload)
    .digest("hex");

  // Timing-safe comparison
  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expBuffer = Buffer.from(expected, "hex");
    if (
      sigBuffer.length !== expBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expBuffer)
    ) {
      return { valid: false, role: null };
    }
  } catch {
    return { valid: false, role: null };
  }

  return { valid: true, role };
}

export async function getAuthRole(): Promise<Role | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;

  const result = verifyCookie(cookie.value);
  return result.valid ? result.role : null;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
