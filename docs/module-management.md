# Module Management System

## Architecture
Phase 8 introduces a dynamic Module Management System for the multi-tenant architecture. 
Instead of forcing every tenant to load the entire ERP codebase, features are scoped and toggled based on the business type (Service vs. Product vs. Both).

The architecture relies heavily on three core models:
- **Company:** The root tenant.
- **Module:** The system-wide catalog of available ERP features.
- **CompanyModule:** The pivot table storing whether a specific module is active for a specific company.

## Module Lifecycle
1. **Provisioning:** During signup (Phase 7), a business selects its type, which dictates the initial array of activated modules.
2. **Execution:** Business APIs now execute a pre-flight guard check (`requireModule`). If the active session belongs to a company that lacks the required module, the API aborts with a `403 Forbidden`.
3. **Administration:** Using `ModuleService`, Super Admins or authorized Company Owners can enable or disable specific modules at runtime without touching code.

## Default Modules
To streamline onboarding, defaults are injected by `lib/modules/defaultModules.ts`:
- **Service Company:** Accounting, Attendance, Payroll, CRM, Projects, Lead Management
- **Product Company:** Inventory, Purchase, Sales, Accounting, CRM
- **Both:** A union of all the above.

## Module Guard
`requireModule(companyId, moduleKey)` acts as a security barrier injected at the top of every critical business API.
- It returns `null` if the company has access, allowing the route to proceed.
- It returns a `NextResponse` (`403 Forbidden`) if access is denied.

Because this guard executes before any Prisma `.findMany()` or `.create()` calls, the database is fully protected from unauthorized access attempts.

## Cache Strategy
Constantly querying `CompanyModule` for every single API request introduces significant overhead. 
- The `moduleCache.ts` singleton resolves this by storing a company's active module keys in an in-memory `Set`.
- Lookups take `O(1)` time.
- The cache respects a 5-minute Time-to-Live (TTL) and is automatically invalidated the moment `ModuleService.enableModule` or `disableModule` is invoked.

## Future Marketplace Support
By abstracting module enabling to a unified service, the architecture is ready to support an "Add-on Marketplace" or billing system. If a company wants to unlock a new feature, `ModuleService.enableModule` can be attached to a Stripe webhook payload, providing instant functionality unlocking.
