# Pre-Migration Checklist

## Database Backup
- [ ] AWS RDS / Local Postgres automated backup verified.
- [ ] Manual snapshot created and tagged `pre-multi-tenant-v1`.

## Prisma Validation
- [ ] `npx prisma format` passes.
- [ ] `npx prisma validate` passes.
- [ ] ALL missing relations and blocking issues are resolved.

## Application Status
- [ ] Legacy Backfill script tested against a production database clone.
- [ ] Staging environment passes all regression tests.

## Production Health
- [ ] CPU/RAM usage normal on Database instance.
- [ ] Zero active deployment locks.

## Coolify Deployment
- [ ] Build script correctly runs `prisma generate`.
- [ ] Start command executes `prisma migrate deploy` (if automated) or documented for manual run.

## Rollback Verification
- [ ] Previous Docker image is available for instant rollback.
