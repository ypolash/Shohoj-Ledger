# Company API Isolation Strategy

## Architecture
Phase 6 enforces strict multi-tenant data boundaries by injecting the `companyId` context (established in Phase 5) directly into Prisma queries. We utilize standard helper modules to prevent code duplication and ensure uniform security controls across 37+ backend APIs.

## Read Flow
The read flow is intercepted using the `withCompany()` helper. 
- **Methodology:** Every `GET` request fetching business data (e.g., `findMany`, `count`, `aggregate`, `findFirst`) spreads the result of `withCompany()` into its Prisma `where` clause.
- **Example:** `prisma.income.findMany({ where: { ...(await withCompany()), status: 'PAID' } })`
- **Result:** If the authenticated session has `companyId: "abc"`, Prisma enforces `where: { companyId: "abc", status: 'PAID' }`.

## Write Flow
Write operations (POST) are constrained by requiring the tenant context at creation.
- **Methodology:** The `getCompanyId()` helper extracts the context from the active session. If it is missing, the request halts with a `403 Forbidden`.
- **Example:** `prisma.income.create({ data: { companyId: await getCompanyId(), amount: 500 } })`

## Ownership Verification
Update and Delete operations (PUT, PATCH, DELETE) pose a severe security risk if users attempt cross-tenant ID enumeration (IDOR).
- **Methodology:** The `verifyOwnership(model, id)` helper executes a pre-flight database check. It fetches the target record's `companyId` and compares it against `session.user.companyId`.
- **Enforcement:** If a mismatch occurs, the request aborts instantly.

## Security
To prevent malicious actors from probing database IDs belonging to other tenants:
- The ownership verification module returns `404 Not Found` rather than `403 Forbidden` if a cross-tenant ID is detected. This deliberately obfuscates the existence of the record, treating it identically to a record that truly does not exist.

## Android Compatibility
Mobile API routes (`app/api/mobile/...`) use the exact same backend logic as the web frontend. Because the isolation injection occurs beneath the API boundary—modifying Prisma query parameters rather than REST inputs—the Android client remains completely unaffected. No JSON structures, endpoints, or response formats have been altered.
