# Production Execution Order

## Step 1: Pre-flight Verification
- Take manual DB snapshot.
- Run tests on staging with production DB clone.
**Rollback Point 1:** No rollback needed, production untouched.

## Step 2: Code Deployment
- Deploy the updated application container.
- Stop application traffic temporarily.
**Rollback Point 2:** Revert Coolify deployment to previous tag.

## Step 3: Database Migration
- Execute `npx prisma migrate deploy`.
**Rollback Point 3:** Revert Application. DB schema remains as additive fields will be ignored by old application code.

## Step 4: Seed & Backfill
- Execute Platform Seeders.
- Execute Legacy Backfill to create the "Shohoj Solution" default tenant and assign orphaned records.
**Rollback Point 4:** Restore database from snapshot if data mapping causes corruption.

## Step 5: Resume Traffic
- Open traffic.
- Monitor API logs for 500 errors.
**Rollback Point 5:** Application rollback + Database restore.
