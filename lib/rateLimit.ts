// Fixed-window, per-instance limiter. Good enough for one container; put a
// shared store (Redis, API Management) in front when running multiple replicas.
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return { ok: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  return { ok: entry.count <= limit, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
}
