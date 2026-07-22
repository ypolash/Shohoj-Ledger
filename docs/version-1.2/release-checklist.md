# Version 1.2 Production Release Checklist

## Database
- [ ] Run `npx prisma format` and `npx prisma validate` locally.
- [ ] Verify `prisma migrate deploy` dry-run against a staging snapshot.
- [ ] Ensure full automated backup of the production database before migration execution.
- [ ] Monitor CPU/IO utilization during indexing of new v1.2 composite indexes.

## Backend / Services
- [ ] Verify all placeholder services (e.g. `WorkflowService`, `InventoryService`) are correctly exported and do not cause circular dependency crashes on initialization.
- [ ] Ensure Background Job polling agents are disabled temporarily if no workers are deployed yet.
- [ ] Verify Server Actions for v1.1 core features pass E2E tests (no regressions).

## Frontend
- [ ] Verify legacy UI navigation is unaffected by new RBAC string constants.
- [ ] Confirm no new unused UI components are breaking the production Webpack/Turbopack build.
- [ ] Verify TypeScript compilation (`tsc --noEmit`) passes cleanly.

## Android
- [ ] Verify legacy API endpoint payloads have not mutated.
- [ ] Run regression suite on Android authentication flow.
- [ ] Test offline-sync behavior (if applicable) for v1.1 models.

## Security
- [ ] Confirm `companyId` filtering middleware correctly handles new API Key authentication routes (if activated).
- [ ] Rotate all non-production DB credentials.
- [ ] Run SAST (Static Application Security Testing) over newly added `lib/` files.

## Monitoring
- [ ] Set up alerts for failed Webhook delivery spikes.
- [ ] Monitor Prisma connection pooling limits, as new tables will increase query breadth.
- [ ] Configure logging for the `NotificationQueue` retry mechanisms.

## Documentation
- [ ] Ensure `docs/version-1.2/*` are committed and accessible to the team.
- [ ] Update `MISSION.md` to declare Phase 0-9 as fully implemented at the database level.
