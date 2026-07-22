# Backup & Restore Verification

## Automated Backup Strategy
The PostgreSQL database running via Coolify is configured with a Scheduled Backup task.
- **Frequency:** Daily at 02:00 AM System Time.
- **Retention:** 7 Days locally, 30 Days on AWS S3 (via S3 integration in Coolify).
- **Format:** `pg_dump` compressed SQL format (`.sql.gz`).

## Verification Protocol (Monthly)
Backups are useless if they cannot be restored. Every 30 days, an engineer must manually verify the integrity of the backup payload.
1. Download the latest `.sql.gz` file from S3.
2. Spin up a local PostgreSQL Docker container: `docker run --name pg-test -e POSTGRES_PASSWORD=test -d postgres`
3. Extract and import the payload: `gunzip < backup.sql.gz | docker exec -i pg-test psql -U postgres`
4. Connect and run: `SELECT count(*) FROM "Company";` to verify data populated correctly.

## Disaster Recovery (Restore Procedure)
If production data is corrupted and a rollback is required:
1. **HALT TRAFFIC:** Stop the Next.js container in Coolify to prevent split-brain data writes during the restore.
2. **TERMINATE DB CONNECTIONS:** Restart the PostgreSQL database to kill active connections.
3. **RESTORE VIA COOLIFY:**
   - Go to Coolify -> Databases -> Postgres -> Backups.
   - Click "Restore" on the most recent healthy backup snapshot.
   - Await success logs.
4. **VERIFY & RESTART:** Run a manual query to ensure data is rolled back. Restart the Next.js application container.
