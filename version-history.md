# Version History

## [1.1.0] - 2026-07-23
### Added
- Multi-company / Multi-tenant architecture.
- Centralized RBAC and permission checks.
- Comprehensive Audit System for enterprise tracking.
- Modular layout for HR, Finance, CRM, and Inventory.

### Fixed
- Fixed Next.js 15+ async `params` breaking changes across 18 dynamic API routes.
- Fixed module resolution errors in `inventory` and `finance` dashboards.
- Resolved Prisma JSON typing errors in audit routes.
- Corrected API imports from `@/lib/auth` to `@/lib/company/companyFilter`.

### Security
- Enhanced tenant isolation by enforcing `companyId` verification on all queries.
