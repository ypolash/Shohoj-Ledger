# Migration Test Checklist

## 1. Before Migration
- [ ] Database clone to staging successfully completed.
- [ ] Production logical backup (`pg_dump`) verified.
- [ ] Staging environment variables correctly pointing to the staging DB.
- [ ] Prisma Schema validated locally (`npx prisma format && npx prisma validate`).
- [ ] No manual schema drifts exist in staging.

## 2. During Migration
- [ ] Execute `npx prisma migrate deploy` on staging.
- [ ] **Monitor Logs**: Watch for index creation locks or warnings.
- [ ] **Capture Errors**: Note any `P3005` (schema engine) or `P2002` (unique constraint) errors.
- [ ] Record the total time taken for the migration script to finish.

## 3. After Migration
- [ ] Run **Database Consistency** scripts (`SELECT COUNT(*)` on core tables).
- [ ] Perform **Data Comparison** between pre-migration dump and post-migration state.
- [ ] Execute **Application Testing**:
  - Login via Web.
  - Login via Android.
  - Create a test Ledger Entry.
  - Create a test Leave Request.
- [ ] Execute **Tenant Isolation Verification**: Ensure `companyId` filtering works correctly on a multi-tenant test account.
- [ ] Execute **Permission Verification**: Ensure `requirePermission` correctly evaluates legacy roles against the updated `DefaultPermissions` array.
