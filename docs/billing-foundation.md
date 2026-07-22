# Subscription & Billing Foundation

## Architecture
Phase 10 lays the architectural groundwork for a scalable, automated multi-tenant SaaS billing system. To protect the stability of existing legacy configurations, this phase implements the backend logic (Plan definitions, Limits, Cycle rules, Guards) without triggering disruptive database schema migrations or activating payment gateways.

## Subscription Plans (`plans.ts`)
The platform supports three distinct subscription tiers:
- **FREE:** 5 Users, 3 Projects, Basic Modules (0 BDT)
- **PRO:** 50 Users, 100 Projects, Full Modules (1,500 BDT/m)
- **ENTERPRISE:** Unlimited Users, Custom Modules (5,000 BDT/m)

## Subscription Lifecycle (`subscriptionService.ts`)
The `SubscriptionService` manages the state machine of a tenant's billing:
1. **TRIAL:** Every new company receives an automatic 14-day trial of the PRO tier.
2. **ACTIVE:** Paid, healthy subscriptions.
3. **PAST_DUE:** If a payment fails (or the trial ends without a card on file), the account enters a 7-day Grace Period.
4. **SUSPENDED:** If the Grace Period elapses without payment, the account is suspended.

## Usage Tracking (`usageTracker.ts`)
Before resource creation endpoints (e.g., `POST /api/employees`), the `UsageTracker` checks the database aggregates (e.g., `await prisma.user.count()`) against the company's active `PlanLimits`. If the limit is exceeded, the request is halted with a `403 Forbidden` requesting an upgrade.

## Subscription Middleware (`subscriptionGuard.ts`)
`requireActiveSubscription()` operates similarly to the RBAC and Module guards. It intercepts API requests, determines the active status via `SubscriptionService.evaluateStatus()`, and instantly rejects requests with a `402 Payment Required` if the account is `SUSPENDED` or `CANCELED`.

During `PAST_DUE` (Grace Period), the guard permits API operations to allow the tenant uninterrupted business flow while their finance department resolves the billing issue.

## Next Steps (Phase 11)
- Map the state objects to a newly generated `CompanySubscription` Prisma model.
- Integrate the payment gateway provider (e.g., Stripe, SSLCommerz).
- Activate the Guard across all endpoints.
