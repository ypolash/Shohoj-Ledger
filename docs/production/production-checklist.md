# Enterprise Production Checklist

Before signing off on any major production release, the Lead DevOps/Engineer must verify the following items:

## 1. Security & Hardening
- [x] Edge Middleware is active and setting Security Headers (`X-Frame-Options`, `HSTS`, `X-Content-Type-Options`).
- [x] Rate Limiter is configured on authentication routes (`POST /api/auth/login`) to prevent brute force attacks.
- [x] JWT secrets and Database URLs are strongly generated and securely stored in Coolify/Vercel secrets.
- [x] The `AuditLogger` is tracking all mutation requests (`POST`, `PUT`, `DELETE`).

## 2. Infrastructure & Coolify
- [x] Coolify is configured to automatically restart the container on failure (`--restart=always`).
- [x] Health checks (`/api/health`) are registered with the Load Balancer to ensure zero-downtime rolling deployments.
- [x] Dockerfile is configured to run the Next.js standalone build for maximum performance.
- [x] Node.js memory limit (`--max-old-space-size`) is explicitly set based on the VPS RAM.

## 3. Database (PostgreSQL)
- [x] Automated nightly backups are enabled via Coolify or a cron job.
- [x] Connection pooling is active (using `pgBouncer` or Prisma connection pooling with `?pgbouncer=true`).
- [x] Production schema matches `prisma/schema.prisma` perfectly with no outstanding drift.

## 4. Error Handling
- [x] The centralized `ApiErrorHandler` is actively masking detailed database stack traces from being sent to the client.
- [x] Application logs are formatted in structured JSON for easier ingestion by Datadog or ELK.

## 5. Billing & Multi-Tenant
- [x] `SubscriptionGuard` is intercepting and accurately suspending non-paying tenants.
- [x] Tenant isolation `companyFilter()` is applied strictly across all APIs.
