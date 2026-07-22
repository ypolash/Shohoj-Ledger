# Technical Debt Review

## API Layer Debt
1. **Monolithic Fat Controllers:** Next.js Route Handlers (`app/api/*/route.ts`) house excessive, unstructured business logic. For example, Payroll logic, complex mathematical calculations, and standard database insertions are coupled entirely to HTTP Request layers.
2. **Duplicated Business Logic:** Validation steps (e.g., verifying if an employee belongs to the company) are repeatedly duplicated across API routes rather than encapsulated in domain layers.
3. **Missing Validation Library:** Inputs are parsed via standard conditional `if (!body.field)` checking instead of using a strict validation schema parser like Zod, risking runtime crashes on malformed data.

## Code Duplication
- **Security Check Repetitions:** The manual execution of `await getCompanyId(); await requireModule(); await requirePermission()` adds significant repetitive boilerplate. A middleware interceptor or HOC (Higher-Order Component) for API routes is highly needed.

## Schema & Typings
- **JSON Field Looseness:** Fields like `workingDays` and `weeklyHolidays` inside `CompanySetting` use the generic `Json` Prisma type without explicit TypeScript strict typings, preventing strict compile-time safety.
- **Nullable Over-Allowance:** Multiple relations inside the Prisma schema utilize optional fields where strict 1-to-1 relationships should logically be required, diluting data integrity.

## Scores
- **Maintainability:** 6.0 / 10
- **Developer Experience:** 7.5 / 10
