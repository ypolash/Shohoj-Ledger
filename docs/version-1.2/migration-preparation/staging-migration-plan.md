# Staging Migration Plan - Version 1.2

## 1. Staging Environment Setup
- Provision a staging server (or isolate a branch on Coolify) identical to the production specification.
- Ensure the Node.js version and Prisma CLI version exactly match the production environment.
- Create an isolated PostgreSQL instance for staging.

## 2. Database Clone Process
- Take a logical dump of the production database using `pg_dump`:
  ```bash
  pg_dump -U [prod_user] -h [prod_host] -d [prod_db] -F c -f prod_snapshot.dump
  ```
- Restore the snapshot into the staging database:
  ```bash
  pg_restore -U [staging_user] -h [staging_host] -d [staging_db] -1 prod_snapshot.dump
  ```
- *Security Note*: Sanitize sensitive information (e.g., scramble real API keys or passwords) if staging is accessible externally.

## 3. Migration Rehearsal Steps
- Deploy the `v1.2` codebase to the staging environment.
- Monitor the exact duration of the `npx prisma migrate deploy` command to estimate the required production downtime.
- Log any warnings or slow index creations.

## 4. Validation Process
- Check `prisma migrate status` for success.
- Start the application and run automated smoke tests.
- Verify that `@@index([companyId])` additions do not cause table lock timeouts on massive tables (like `LedgerEntry` or `StockTransaction`).
