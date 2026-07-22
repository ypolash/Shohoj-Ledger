/**
 * In-memory cache for Role Permissions to avoid excessive DB queries per API request.
 * Keys are Role IDs. Values are Sets of permission actions (e.g., 'PAYROLL_MANAGE').
 */
class PermissionCache {
  private cache: Map<string, { actions: Set<string>; expires: number }> = new Map();
  private readonly TTL = 1000 * 60 * 5; // 5 minutes

  get(roleId: string): Set<string> | null {
    const entry = this.cache.get(roleId);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(roleId);
      return null;
    }
    return entry.actions;
  }

  set(roleId: string, actions: string[]) {
    this.cache.set(roleId, {
      actions: new Set(actions),
      expires: Date.now() + this.TTL
    });
  }

  invalidate(roleId: string) {
    this.cache.delete(roleId);
  }

  clear() {
    this.cache.clear();
  }
}

export const permissionCache = new PermissionCache();
