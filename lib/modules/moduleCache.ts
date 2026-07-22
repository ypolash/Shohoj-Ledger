/**
 * In-memory cache for active modules per company to prevent repetitive DB queries.
 * In a production multi-node environment, this should ideally be backed by Redis.
 */
class ModuleCache {
  private cache: Map<string, { modules: Set<string>; expires: number }> = new Map();
  private readonly TTL = 1000 * 60 * 5; // 5 minutes

  /**
   * Retrieves the active module keys for a specific company from cache.
   */
  get(companyId: string): Set<string> | null {
    const entry = this.cache.get(companyId);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(companyId);
      return null;
    }
    return entry.modules;
  }

  /**
   * Sets the active module keys for a specific company in cache.
   */
  set(companyId: string, modules: string[]) {
    this.cache.set(companyId, {
      modules: new Set(modules),
      expires: Date.now() + this.TTL
    });
  }

  /**
   * Invalidates the cache for a specific company when its modules change.
   */
  invalidate(companyId: string) {
    this.cache.delete(companyId);
  }

  /**
   * Clears the entire cache.
   */
  clear() {
    this.cache.clear();
  }
}

export const moduleCache = new ModuleCache();
