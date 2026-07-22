# Deployment Checklist

## Pre Deployment
- [ ] Ensure all additive Prisma schema changes are merged to main.
- [ ] Verify `npx prisma validate` passes.
- [ ] Ensure `DATABASE_URL` is correct in Coolify.
- [ ] Take a manual PostgreSQL database backup/snapshot.
- [ ] Confirm the Legacy Backfill script is tested locally.

## Deployment
- [ ] Trigger deployment in Coolify.
- [ ] Run `npx prisma migrate deploy` to safely add new columns and tables.
- [ ] Verify the application starts successfully (old code ignores new fields).

## Post Deployment
- [ ] Execute Platform Seeders (Modules, Permissions).
- [ ] Execute Legacy Company Backfill (`Shohoj Solution` creation and mapping).
- [ ] Verify database logs show 100% of records mapped successfully.

## Validation
- [ ] Check Android App functionality (Clock-in, Attendance view).
- [ ] Check Web Dashboard functionality (Expenses, Payroll).
- [ ] Verify no data loss occurred.
- [ ] Verify API endpoints are responding successfully.

## Rollback Checklist
- [ ] If validation fails: Trigger Coolify rollback to previous image.
- [ ] Confirm application stability restored.
- [ ] Identify failure point from logs before attempting re-deployment.
