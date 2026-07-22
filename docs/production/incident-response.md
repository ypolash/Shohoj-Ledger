# Incident Response Plan

## Classification Levels
- **SEV-1 (Critical):** Complete system outage, data breach, or catastrophic failure of multi-tenant isolation.
- **SEV-2 (High):** Major feature broken (e.g., Payroll generation fails, Login broken for subset of users).
- **SEV-3 (Medium):** Minor feature broken with a workaround (e.g., Reports exporting slowly).

## Immediate Response Protocol (SEV-1)
1. **Verify the Outage:** Check `/api/health`. Check VPS resource usage (RAM/CPU via htop or Coolify dashboard).
2. **Containment:** If a data breach or cross-tenant leakage is suspected, immediately scale the application containers to `0` in Coolify to halt all external traffic.
3. **Database Lock:** If a destructive query was run, instantly revoke application database credentials.
4. **Identify Root Cause:** Search `AuditLogger` outputs and `ApiErrorHandler` JSON logs for immediate stack traces.
5. **Mitigation:** Implement the fastest possible fix (Rollback to previous deployment or deploy a hotfix).
6. **Recovery:** Restore traffic and monitor error rates for 30 minutes.

## Post-Mortem Requirement
Every SEV-1 and SEV-2 incident requires a documented Post-Mortem within 48 hours, detailing:
- **Timeline of events**
- **Root Cause Analysis (5 Whys)**
- **What went well / What went wrong**
- **Action items to prevent recurrence** (e.g., adding a specific e2e test, updating Prisma indexes).
