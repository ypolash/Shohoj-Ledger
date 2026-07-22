# Version 1.2 Release Risk Assessment

## 1. Database Failure
- **Risk**: The `prisma migrate deploy` step fails mid-execution due to a strict constraint violation or connection drop, leaving the database in an inconsistent state.
- **Probability**: Low (Migration is strictly additive).
- **Impact**: Critical (Downtime).
- **Mitigation**: Rely solely on the immediate restoration of the logical `pg_dump` or Cloud Volume Snapshot. Do not attempt manual SQL fixes during a live release window.

## 2. Deployment Failure
- **Risk**: The Next.js build fails on the Coolify server due to Memory constraints or TypeScript errors previously missed.
- **Probability**: Medium.
- **Impact**: Low (Coolify prevents the broken container from replacing the live v1.1 container).
- **Mitigation**: Validate the build locally with `npm run build` using the exact Node version before pushing to the production branch.

## 3. Performance Issues
- **Risk**: Adding dozens of new relational lists (e.g. `User.businessInsights`, `Company.stockTransfers`) inadvertently causes Prisma `include` statements in legacy code to fetch massive amounts of unbounded relational data.
- **Probability**: Low (Prisma requires explicit `include` declarations).
- **Impact**: High (Memory exhaustion, DB CPU spike).
- **Mitigation**: Monitor API latency immediately post-launch. Identify slow endpoints and rollback if latency severely impacts user experience.

## 4. Tenant Isolation Issues
- **Risk**: A developer accidentally exposes a new v1.2 API endpoint without wrapping it in the `getCompanyId()` tenant filter.
- **Probability**: Low (Code is currently strictly structural, UI/APIs for v1.2 are not yet live).
- **Impact**: Critical (Data leak).
- **Mitigation**: Conduct a strict code review on all exposed API routes before they are wired to the UI in future phases.

## 5. Rollback Scenarios
- **Scenario A (Code Failure, DB Safe)**: The backend crashes, but the DB schema is fine. 
  *Action*: Revert the Git commit and redeploy via Coolify.
- **Scenario B (DB Corruption, Code Safe)**: The schema migration causes data lock/loss.
  *Action*: Stop Coolify container, drop DB, restore snapshot, restart Coolify container.
- **Scenario C (Android API Breakage)**: Android users report mass crashes.
  *Action*: Identify if it's a payload change. If unfixable quickly, execute Scenario A (Code Rollback). The new additive DB columns will silently ignore v1.1 code.
