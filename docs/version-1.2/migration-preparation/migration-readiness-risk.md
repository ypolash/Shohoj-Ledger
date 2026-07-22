# Migration Readiness Risk Review

## 1. Timeout / Table Lock Failure
- **Risk**: Creating new indexes (e.g. `@@index([companyId])` on massive legacy tables) might lock the table, causing the migration script to timeout and fail midway.
- **Detection Method**: Prisma CLI will throw a timeout error during `migrate deploy`.
- **Recovery Plan**: Restore the staging database, split the large migration file into two parts (one for creating tables, one for applying indexes asynchronously `CONCURRENTLY`), and retry.

## 2. Silent Data Coercion
- **Risk**: Prisma attempts to coerce null fields or maps existing string statuses to the new Enums in an unexpected way.
- **Detection Method**: The Data Validation Plan catches discrepancies in `PurchaseOrder.status` or `Warehouse.status`.
- **Recovery Plan**: Stop the migration. Review the auto-generated Prisma SQL migration file to ensure it is purely additive and does not include `ALTER COLUMN ... TYPE` statements for legacy fields.

## 3. Android API Payload Breakage
- **Risk**: Prisma includes relational arrays (e.g. `User.businessInsights`) automatically in a deeply nested legacy API query, altering the JSON structure returned to the Android app, causing GSON/Moshi parser crashes.
- **Detection Method**: Manual QA of the Android app against the staging server.
- **Recovery Plan**: Update the backend API `select` or `include` statements to strictly exclude the new relational arrays on legacy endpoints.

## 4. OOM (Out of Memory) Crash
- **Risk**: Generating the massive new Prisma Client locally or on Coolify exceeds the 2GB memory limit.
- **Detection Method**: `npm run build` or `npx prisma generate` fails with `Killed` or `Heap out of memory`.
- **Recovery Plan**: Increase swap space or RAM limits on the deployment container.
