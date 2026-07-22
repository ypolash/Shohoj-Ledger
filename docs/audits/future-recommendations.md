# Future Recommendations & Enterprise Roadmap

## Critical Issues (Immediate Action Required)
1. **Server-Side Pagination:** The backend API must implement `limit` and `skip` mechanics on high-density collections (Attendances, Leads, Transactions). As tenant size scales, unpaginated reads will severely degrade heap memory and performance.
2. **Missing Database Indexes:** Generate a Prisma schema optimization migration introducing compound indices specifically targeting `@@index([companyId, date])` and `@@index([companyId, status])` for critical lookup fields.

## High Priority
1. **Distributed Caching (Redis):** Transition `permissionCache` and `moduleCache` from Node.js in-memory Maps to a centralized Redis cluster to safely support horizontal scaling without risking stale authorization graphs.
2. **Input Validation Layer:** Implement `Zod` parsing at the API controller boundaries to strictly validate and strip unwanted payloads from mutating database data.
3. **API Middleware Refactor:** Consolidate the 3-step security check (`session` > `RBAC` > `Module`) into a unified, clean Next.js Middleware or HOC (Higher-Order Function) to instantly eliminate boilerplate inside individual route handlers.

## Medium Priority
1. **Service Layer Abstraction:** Extract business logic (e.g., payroll calculations, leave deductions) entirely out of the Next.js `route.ts` handlers and into dedicated isolated files inside `lib/services/*`.
2. **Audit Logging Service:** Build an automated event listener or logging utility that tracks every `POST`, `PUT`, `PATCH`, and `DELETE` operation, recording the user ID, timestamp, target record ID, and JSON patch diff.

## Low Priority
1. **Data Soft Deletes:** Currently, several records are physically dropped from the database. Implement a `deletedAt` DateTime flag on Prisma models to preserve historical financial integrity.
2. **Centralized Error Handling:** Replace repetitive `NextResponse.json({ error }, { status: 500 })` statements with a global unified Error Factory class ensuring consistent error messaging and standardized diagnostic codes.

## Future Improvements (V2)
- **Add-on Marketplace Integration:** Tie `ModuleService.enableModule()` to payment gateway webhooks (e.g., Stripe) for self-service SaaS feature unlocking.
- **Microservice Event Bus:** If particular ERP functions (like bulk email campaigns or end-of-month payroll processing) grow massive, decouple them into a serverless queue (SQS / RabbitMQ) instead of blocking the Next.js main thread.
