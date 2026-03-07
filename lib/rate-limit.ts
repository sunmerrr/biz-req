const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const ENDPOINTS: Record<string, RateLimitConfig> = {
  chat: { maxRequests: 10, windowMs: 60_000 },
  complete: { maxRequests: 3, windowMs: 60_000 },
  prototype: { maxRequests: 3, windowMs: 60_000 },
  preview: { maxRequests: 3, windowMs: 60_000 },
  auth: { maxRequests: 5, windowMs: 60_000 },
};

export function checkRateLimit(
  endpoint: string,
  identifier: string = "global"
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = ENDPOINTS[endpoint];
  if (!config) {
    return { allowed: true, remaining: 999, resetAt: 0 };
  }

  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}
