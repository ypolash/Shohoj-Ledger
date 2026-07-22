# Database Migration Runbook - Version 1.2

## 1. Backup Steps
1. **Block Traffic**: Redirect incoming requests to a 503 Maintenance page (handled via Coolify proxy config or application flag).
2. **Snapshot**: From your cloud provider console or CLI, trigger a block-level snapshot of the production PostgreSQL database volume.
3. **Logical Dump (Secondary)**: 
   ```bash
   pg_dump -U [user] -d [database] -F c -f /backup/shohoj_ledger_v1.1_pre_migration.dump
   ```

## 2. Migration Order
1. SSH into the production server or use the Coolify terminal.
2. Navigate to the application root directory.
3. Execute the migration against the live database:
   ```bash
   npx prisma migrate deploy
   ```
   *(Note: This applies all pending migrations from the `prisma/migrations` folder safely).*
4. Re-generate the Prisma Client to map the new schema:
   ```bash
   npx prisma generate
   ```

## 3. Validation Steps
1. Verify the migration history table:
   ```bash
   npx prisma migrate status
   ```
   Ensure the status shows the database is completely up to date.
2. Connect to the database via `psql` or a UI tool and verify the existence of the new tables (e.g., `AnalyticsSnapshot`, `Branch`, `Workflow`).

## 4. Data Verification
1. Run a `SELECT COUNT(*)` on legacy tables (`User`, `Company`, `Employee`) and compare to pre-migration numbers.
2. Ensure no fields were accidentally nulled by running checks on critical columns.
3. Because the migration is 100% additive, all data should be untouched.

## 5. Rollback Plan
If `prisma migrate deploy` fails or causes data locking issues:
1. **DO NOT** attempt to write a manual "down" migration.
2. Stop the application container.
3. Drop the corrupted database schema.
4. Restore immediately from the logical dump:
   ```bash
   pg_restore -U [user] -d [database] -1 /backup/shohoj_ledger_v1.1_pre_migration.dump
   ```
5. Alternatively, restore the cloud volume snapshot.
6. Restart the v1.1 application container.
