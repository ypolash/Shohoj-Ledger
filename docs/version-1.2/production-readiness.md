# Version 1.2 Production Readiness & Security

## Security Audit

### Tenant Isolation
The system correctly enforces a strict hard-boundary multi-tenancy. No `User`, `Branch`, or `Webhook` can cross-pollinate. 
- **Risk Level**: Low. `companyId` is heavily standardized across the Prisma schema.
- **Mitigation**: Future queries must strictly use the unified `getCompanyId()` wrapper from the session context in all new Server Actions.

### Permission Boundaries
The system is moving from coarse-grained global permissions to context-aware granular permissions (`BranchPermission`).
- **Risk Level**: Medium. Hybrid permission evaluation (Global + Branch) is complex.
- **Mitigation**: The `requirePermission` guard must be carefully upgraded to accept optional `branchId` context objects without breaking older global checks.

### API & Webhook Security
- API Keys are correctly salted/hashed (Schema uses `hashedKey`).
- Webhooks track delivery failures and include signing secrets.
- **Risk Level**: Low/Medium. 

## Performance Audit

### Database Growth
- **Risk**: Tables like `AnalyticsSnapshot`, `NotificationDeliveryLog`, and `WebhookDelivery` will grow linearly, eventually slowing down `SELECT COUNT(*)` queries.
- **Mitigation**: Implement automated pruning (e.g., deleting successful Webhook logs after 30 days) inside the `BackgroundJob` framework.

### Query Performance
- **Risk**: Branch-level data aggregation requires complex joins (e.g. `Company -> Branch -> Warehouse -> InventoryTransaction`).
- **Mitigation**: Rely heavily on Prisma's `include` vs `select` optimization and utilize raw SQL views for dense multi-branch P&L reporting.

### Background Processing
- The infrastructure correctly anticipates offloading heavy workloads via `NotificationQueue` and `BackgroundJob`.
- **Readiness**: High. The data structures fully support a standalone Node worker or serverless CRON triggering.

## Migration Strategy Review

### Deployment Sequence
1. **Freeze**: Announce brief maintenance window (No inserts).
2. **Backup**: Trigger GCP/AWS snapshot of the active PostgreSQL instance.
3. **Migrate**: Run `npx prisma migrate deploy` to create the new tables. This is purely additive and safe.
4. **Deploy**: Roll out backend/frontend Node codebase.
5. **Verify**: Run smoke tests on Android and Web.

### Rollback Strategy
If `prisma migrate deploy` fails halfway, restore the database from the snapshot and rollback the codebase to the previous Git SHA. Zero schema mutations occurred to existing columns, making rollback mathematically simple.
