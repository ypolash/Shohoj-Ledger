# Enterprise RBAC (Role-Based Access Control)

## Architecture
Phase 9 transitions the Shohoj Ledger from a binary (Admin vs. User) security model into a fully granular, Enterprise Role-Based Access Control (RBAC) architecture.

The system utilizes three core Prisma models:
- **Role:** Specific to a company (e.g., Company A has a unique "Manager" role, Company B has its own "Manager" role).
- **Permission:** Global actions defined at the platform level (e.g., `PAYROLL_MANAGE`).
- **RolePermission:** The associative junction table linking permissions to roles.

## Permission Flow
Permissions govern micro-actions across different ERP modules. For example, instead of a user having access to the entire "Payroll" module, they are explicitly granted `PAYROLL_VIEW` (to read data) or `PAYROLL_MANAGE` (to generate and delete data).

1. A user attempts an action via the API.
2. The endpoint invokes `requirePermission(session, 'ACTION')`.
3. The guard extracts the user's `roleId`.
4. It resolves the `Set<string>` of permitted actions and verifies inclusion.

## Role Flow
Roles are provisioned during Company Onboarding (Phase 7). The default generated roles include:
- **Admin:** Has almost all permissions globally.
- **HR:** Has `EMPLOYEE_MANAGE`, `ATTENDANCE_MANAGE`, `PAYROLL_MANAGE`.
- **Accountant:** Has `FINANCE_MANAGE`, `PAYROLL_VIEW`.
- **Manager:** Has `PROJECT_MANAGE`, `EMPLOYEE_VIEW`.
- **Employee:** Has basic read-only module views.

These roles are strictly bound by `companyId`.

## Caching Strategy
To ensure that complex permission verifications do not degrade API performance:
- Permissions are cached using a rapid `O(1)` in-memory `Map` in `permissionCache.ts`.
- The cache key is the `roleId`. The value is a `Set<string>` of `action` names.
- It features a rolling 5-minute TTL.
- Calling `RbacService.assignPermissions()` actively invalidates the cache for that specific `roleId`, guaranteeing real-time security enforcement.

## Super Admin & Owner Bypasses
- **Platform Super Admins** (`platformRole === "SUPER_ADMIN"`) entirely bypass the RBAC guard. They act as system administrators with omnipresent access.
- **Company Owners** (`platformRole === "CLIENT_ADMIN"` or `role === "Owner"`) are automatically granted full traversal across all features *within their own company*. Since their requests have been pre-filtered by Phase 6 Company Isolation, this bypass is 100% tenant-safe.

## Security Guarantees
- The frontend is completely decoupled from access authorization; client-side tokens or boolean flags are completely ignored.
- The server serves as the absolute Source of Truth, executing validation strictly inside the isolated backend routing layer.

## Future Expansion
The architecture fully supports a dynamic UI "Role Management" grid, where Administrators can create custom roles (e.g., "Junior Accountant") and individually toggle permission checkboxes, seamlessly syncing to the backend via `RbacService`.
