# Version 1.2 Go-Live Checklist

## Database
- [ ] Production snapshot/backup completed and verified.
- [ ] `npx prisma migrate deploy` executed successfully.
- [ ] Old tables (`User`, `Company`) verified to have intact data.
- [ ] New tables (`Workflow`, `AnalyticsSnapshot`, etc.) verified to exist.

## Backend
- [ ] Next.js server container started without errors.
- [ ] Environment variables verified in production context.
- [ ] Background job processors (if any) paused or properly initialized.
- [ ] New service classes verified not to cause circular dependency crashes.

## Frontend
- [ ] Build successful (`next build`).
- [ ] Application loads in browser without React hydration errors.
- [ ] Existing UI functionality (Authentication, Dashboard, Ledger) functions normally.

## Android
- [ ] Tested login flow on the Android App.
- [ ] Tested core API payloads (Attendance, Expense, etc.) via Android App.
- [ ] API compatibility verified (No 400 or 500 errors returned to mobile).

## Security
- [ ] Legacy permissions continue to grant standard access.
- [ ] `companyId` boundaries remain completely sealed.
- [ ] New RBAC strings are correctly loaded into the `DefaultPermissions` array.
- [ ] Maintenance mode successfully disabled and normal traffic restored.
