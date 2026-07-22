# Shohoj Ledger v1.2 Production Release Plan

## Release Overview
The Version 1.2 release transitions Shohoj Ledger from a standard ERP (v1.1) to an Enterprise-grade Architecture. This release strictly deploys the **Database Architecture** foundations (Phases 0-9) to production. The primary goal is a "Dark Release", meaning the schema is upgraded and validated without altering any live v1.1 UI or Android behaviors.

## Deployment Phases
### Phase 1: Backup & Preparation
- Announce a brief 10-minute maintenance window for DB lock.
- Execute full database snapshot and logical backup via pg_dump.
- Verify snapshot integrity.

### Phase 2: Database Migration
- Execute `npx prisma migrate deploy` in the production environment.
- Validate the schema changes.
- Verify zero disruption to existing records.

### Phase 3: Backend Deployment
- Deploy the updated Next.js API layer and new service class foundations to Coolify.
- Confirm successful startup (environment variables, Prisma Client generation).

### Phase 4: Frontend Deployment
- Ensure the React UI builds successfully on the new backend branch.
- Deploy the static/hybrid assets to the edge/server.

### Phase 5: Verification
- Run a smoke test suite specifically targeting legacy v1.1 APIs and workflows.
- Validate that the Android application connects properly without payload failures.

### Phase 6: Go Live
- Remove the maintenance notice.
- Open traffic to all users.
- Shift to intensive monitoring mode for 24 hours.

## Dependencies
- **PostgreSQL**: Must be available for schema alterations.
- **Coolify**: Used for orchestrating the build and deployment pipeline.
- **Environment**: Node.js 18+, Prisma CLI.

## Timeline
- **T-Minus 24h**: Notify all internal staff. Take a dry-run backup.
- **T-Zero (00:00)**: Enable maintenance mode.
- **00:05**: Complete production snapshot.
- **00:10**: Run Prisma Migrate.
- **00:15**: Trigger Coolify Build & Deploy.
- **00:25**: Smoke Test execution.
- **00:30**: Maintenance mode off, full Go Live.

## Responsible Areas
- **DevOps**: Backup, Coolify Deployment, Rollback Execution.
- **Backend/DBA**: Migration monitoring, schema validation.
- **QA**: Legacy UI/Android smoke testing post-deployment.
