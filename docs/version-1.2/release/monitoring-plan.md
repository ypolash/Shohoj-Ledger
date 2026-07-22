# Version 1.2 Monitoring Plan

## 1. Application Monitoring
- **Endpoint Health**: Monitor `/api/health` using an external uptime tracker (e.g., UptimeRobot, Pingdom).
- **Log Aggregation**: Ensure Coolify logs are shipped to a central logging tool (e.g., Axiom, Datadog, or Grafana Loki) to monitor for unhandled Exceptions or Promise rejections.
- **Traffic Spikes**: Watch for unusual traffic targeting the new API Platform/Webhook endpoints.

## 2. Database Monitoring
- **Query Performance**: Monitor slow queries. The new composite indexes (e.g. `@@index([companyId, code])`) should keep lookups fast, but missing indexes on large joins could cause CPU spikes.
- **Connection Pooling**: Monitor Prisma connection pool saturation. If `pg_stat_activity` shows heavy waiting, increase the `connection_limit` in the `DATABASE_URL`.
- **Storage Growth**: Track database disk usage. The new `InventoryTransaction`, `WebhookDelivery`, and `AnalyticsSnapshot` tables will accelerate disk consumption.

## 3. Error Tracking
- Implement/Verify Sentry (or equivalent) in the Next.js application.
- Look specifically for Prisma errors (e.g., `P2002` Unique constraint failed, `P2025` Record not found) occurring on legacy v1.1 operations.
- Set up critical alerts for the DevOps channel if the error rate exceeds 1% of total requests over a 5-minute window.

## 4. Performance Metrics
- **API Latency**: Track average response times for legacy API routes. They must remain unchanged.
- **Memory Usage**: Monitor the Node.js container memory in Coolify. Ensure there are no memory leaks introduced by the new foundational service classes.
