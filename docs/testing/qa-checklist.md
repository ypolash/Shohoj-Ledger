# Quality Assurance (QA) Checklist

## 1. Database & Data Integrity

- [x] Verified `companyId` isolation on all tables.
- [x] Verified foreign key constraints cascade deletes properly to avoid orphaned records.
- [x] Verified no hardcoded strings bypass Prisma type constraints.

## 2. Authentication & Authorization

- [x] Login flow issues secure HTTP-only cookies with signed JWTs.
- [x] Logout immediately invalidates local session.
- [x] `companyContext` correctly filters out access to wrong tenants.
- [x] `PLATFORM_ROLE` bypasses tenant restrictions accurately.

## 3. RBAC (Role-Based Access Control)

- [x] Owner accounts bypass specific permission checks (e.g. `PAYROLL_MANAGE`).
- [x] Standard Employee accounts reject sensitive mutations (403 Forbidden).
- [x] Permissions resolve strictly via the `permissionCache`.

## 4. Module Management

- [x] Disabling a module instantly blocks API endpoints tied to it.
- [x] API throws a standard `403 Module Disabled` response.
- [x] Re-enabling a module correctly invalidates the cache.

## 5. Mobile / Android Compatibility

- [x] API structures (`data` payloads) remain unchanged for legacy mobile apps.
- [x] Authentication tokens parsed correctly for Android clients.

## 6. Security

- [x] SQL Injection prevented by Prisma parameterization.
- [x] Broken Access Control mitigated by `withCompany()` interceptor.
- [x] XSS prevented in rendering by React's native string escaping.
