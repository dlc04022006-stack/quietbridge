import { describe, expect, it } from "vitest";
import { InMemoryFixedWindowRateLimiter } from "./rate-limit.js";

describe("in-memory fixed-window rate limiter", () => {
  it("blocks requests over the limit and resets after the window", () => {
    let now = 1_000;
    const limiter = new InMemoryFixedWindowRateLimiter(2, 10_000, () => now);

    expect(limiter.consume("client")).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.consume("client")).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.consume("client")).toMatchObject({ allowed: false, remaining: 0 });
    expect(limiter.consume("other-client").allowed).toBe(true);

    now += 10_000;
    expect(limiter.consume("client")).toMatchObject({ allowed: true, remaining: 1 });
  });
});
