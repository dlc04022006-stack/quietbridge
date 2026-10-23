export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface WindowState {
  startedAt: number;
  count: number;
}

export class InMemoryFixedWindowRateLimiter {
  private readonly windows = new Map<string, WindowState>();

  constructor(
    private readonly maxRequests = 120,
    private readonly windowMs = 60_000,
    private readonly now: () => number = Date.now
  ) {}

  consume(key: string): RateLimitResult {
    const current = this.now();
    const existing = this.windows.get(key);
    const state =
      !existing || current - existing.startedAt >= this.windowMs
        ? { startedAt: current, count: 0 }
        : existing;
    state.count += 1;
    this.windows.set(key, state);

    const remaining = Math.max(0, this.maxRequests - state.count);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((state.startedAt + this.windowMs - current) / 1_000)
    );
    return {
      allowed: state.count <= this.maxRequests,
      remaining,
      retryAfterSeconds
    };
  }
}
