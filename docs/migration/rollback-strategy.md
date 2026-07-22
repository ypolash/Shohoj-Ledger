# Rollback Strategy

## Rollback Order
1. Divert traffic from production (if downtime is required) or disable new API routes.
2. Application Rollback (revert Docker image/git commit).
3. Database Rollback (revert DB schema if destructive, but we are additive).
4. Restore application traffic.

## Production Rollback
If the application fails post-deployment, we will immediately revert to the previous Coolify deployment tag. Since all DB changes are additive (`companyId String?`), the old application code will seamlessly ignore the new columns and relations.

## Database Rollback
Because we adhered to the "No Destructive Migrations" rule:
- Do NOT run `prisma migrate down` or drop the `companyId` columns.
- Leave the new tables (`Company`, `Module`, etc.) dormant.
- The schema is fully backward compatible, so a DB rollback is physically unnecessary and risky.

## Application Rollback
- Revert via Git: `git revert <merge-commit>`
- Rebuild via Coolify to the last known stable state.

## Emergency Rollback
In catastrophic failure (e.g., data corruption during the backfill script):
- Stop the application containers.
- Restore the PostgreSQL database from the pre-deployment automated snapshot.
- Re-deploy the previous Git commit.
