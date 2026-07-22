# Multi-Company Migration Plan

## Migration Phases
- **Phase 0:** Audit & Assessment
- **Phase 1 & 1.5:** Additive Database Schema Expansion
- **Phase 2:** Strategy & Documentation (Current)
- **Phase 3:** Database Migration Deployment (`npx prisma migrate deploy`)
- **Phase 4:** Seeding Platform defaults (Modules, Permissions)
- **Phase 5:** Legacy Backfill (Create "Shohoj Solution" and map all legacy data)
- **Phase 6:** API Middleware & Auth Context Update (Tenant Injection)
- **Phase 7:** API Logic Updates (Making tenant isolation mandatory in queries)
- **Phase 8:** Frontend/Android adjustments for Tenant Context (if required)
- **Phase 9:** Mandatory non-null conversion (Long term)

## Execution Order
1. Merge Schema Additions
2. Run Prisma Migrate Deploy
3. Run Platform Seeders
4. Run Legacy Backfill Script
5. Deploy Auth/Middleware changes
6. Deploy API changes

## Deployment Order
1. Deploy new code with Prisma schemas to staging
2. Execute DB Migration on Production
3. Execute Seeders & Backfill on Production
4. Monitor system stability
5. Deploy updated API endpoints utilizing the middleware

## Rollback Order
1. Revert Application Code (git revert)
2. Soft revert of DB changes (or keep additive changes inactive)
3. Reverse Legacy Backfill (not necessary if additive, but document)
4. Restore previous deployment container

## Production Strategy
- **Zero Downtime:** Use additive changes only (nullable columns).
- **Grace Period:** Legacy APIs continue to work without `companyId` headers because the backfill script maps old data. 
- **Backward Compatibility:** All new endpoints/features handle `companyId` strictly, while v1 routes inject the "Shohoj Solution" default tenant if missing.
