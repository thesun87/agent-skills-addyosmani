import { db } from "./db";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Sliding window rate limiter backed by Postgres RateLimitHit table (AD4).
 * @param key unique identifier (e.g. `order:${clientIp}`)
 * @param maxHits maximum allowed hits within the window
 * @param windowSeconds length of sliding window in seconds (default 600 = 10 minutes)
 */
export async function checkRateLimit(
  key: string,
  maxHits: number = 5,
  windowSeconds: number = 600,
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  const count = await db.rateLimitHit.count({
    where: {
      key,
      createdAt: { gte: windowStart },
    },
  });

  if (count >= maxHits) {
    return { allowed: false, remaining: 0 };
  }

  await db.rateLimitHit.create({
    data: { key },
  });

  return { allowed: true, remaining: maxHits - count - 1 };
}
