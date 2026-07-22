import { NextResponse } from "next/server";

class RateLimiter {
  private cache: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly WINDOW_MS = 60 * 1000; // 1 minute window

  /**
   * Applies rate limiting to a specific identifier (e.g., IP address or User ID).
   * @param identifier Unique key (IP or user ID)
   * @param limit Max requests per window
   */
  async checkLimit(identifier: string, limit: number = 60) {
    const now = Date.now();
    const record = this.cache.get(identifier);

    if (!record) {
      this.cache.set(identifier, { count: 1, timestamp: now });
      return null;
    }

    if (now - record.timestamp > this.WINDOW_MS) {
      // Reset window
      this.cache.set(identifier, { count: 1, timestamp: now });
      return null;
    }

    if (record.count >= limit) {
      return NextResponse.json(
        { error: "Too Many Requests", message: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    record.count += 1;
    this.cache.set(identifier, record);
    return null;
  }
}

export const rateLimiter = new RateLimiter();
