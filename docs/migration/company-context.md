# Company Context Injection

## Purpose
Phase 5 establishes the foundation for multi-tenant isolation by safely injecting the `companyId` (and other multi-tenant authorization fields like `platformRole` and `roleId`) directly into the authenticated session. It does *not* enforce filtering yet; it solely makes the context available for the future Phase 6 (API/Auth Middleware).

## Authentication Flow
The injection happens at the highest point of the authentication funnel in `app/api/auth/login/route.ts`:
1. The user/employee submits credentials.
2. The credential verification completes (using Bcrypt / Better-Auth).
3. Right before generating the JWT via `createSession(payload)`, the system invokes the reusable helper `getCompanyContext(userId, role)`.
4. The helper performs a targeted query to fetch the `companyId` (and `platformRole`/`roleId` for Admins).
5. These values are merged into the session payload.

## Session Structure
The updated JWT payload (`user` object) now exposes:
- `id` (String)
- `email` (String)
- `name` (String)
- `role` (String: "ADMIN" | "EMPLOYEE")
- **`companyId`** (String | null)
- **`platformRole`** (String | null)
- **`roleId`** (String | null)

## Backward Compatibility
- **Existing Sessions:** Old sessions lacking these new fields will simply resolve them as `undefined` or `null` during extraction, causing zero disruption to current logic.
- **Null states:** Users operating without a `companyId` (such as Platform Admins or non-migrated users) remain fully functional as the payload correctly handles `null` values.
- **Frontend & Android:** Neither client is required to supply `companyId` during login; it is resolved server-side.

## Security Notes
- **Database truth:** Context is derived exclusively from the database during authentication, completely circumventing client-side tampering or injection via API payloads.
- **Read-Only Context:** These fields are stored immutably inside the signed JWT.

## Future Usage
In Phase 6, this injected context will be automatically parsed by API middlewares to append `where: { companyId: session.user.companyId }` to Prisma queries, enabling complete horizontal data isolation per tenant without refactoring individual business endpoints.
