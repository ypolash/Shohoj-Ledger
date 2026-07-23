# Enterprise Customer Credit Management (Version 1.3 Phase 3H)

## Overview
The Enterprise Customer Credit Management module is the financial safeguard of the CRM/Sales pipeline. Positioned before Invoices (Phase 3I), it strictly governs the purchasing power of B2B clients by enforcing credit limits, tracking financial exposure, and executing credit holds.

## Architecture
- **Database Models:**
  - `CustomerCreditProfile`: A 1-to-1 extension of the `Customer` model that stores the limit, current exposure, risk level, and hold status.
  - `CustomerCreditHistory`: An append-only ledger tracking every increase or decrease in exposure, explicitly tied to the transaction (Sales Order, Delivery, etc.) that caused it.
- **Service Layer:** `lib/crm/customerCreditService.ts` manages limits, holds, and dynamic risk evaluation based on credit utilization.

## Credit Policy & Exposure Calculation
- **Credit Limit:** The maximum allowable financial exposure for a customer.
- **Current Exposure:** The total monetary value of goods/services committed to the customer that have not yet been paid for.
- **Exposure Mechanics (Phase 3H Context):**
  - When a Sales Order is approved, `recordExposure()` adds the total value to `currentExposure`.
  - When an order is cancelled or eventually paid (Phase 3I), `recordRelease()` subtracts that value.
  - *Note: Because Invoicing does not exist yet, exposure is driven by order approval values.*
- **Available Credit:** Mathematically derived as `creditLimit - currentExposure`.

## Risk Evaluation
The system automatically classifies the `RiskLevel` every time exposure changes based on utilization (`exposure / limit`):
- `LOW`: < 50%
- `MEDIUM`: 50% - 74.9%
- `HIGH`: 75% - 89.9%
- `CRITICAL`: 90%+ (or any exposure when limit is 0)

## Hold Workflow
- **Manual Holds:** Authorized users can invoke `placeOnHold(reason)` to freeze an account.
- **Hold Enforcement:** `validateCredit()` strictly blocks any new Sales Order approvals if `isOnHold` is true, regardless of available credit.
- **Release:** `releaseHold(reason)` unfreezes the account.

## Audit & Security
- **History Ledger:** `CustomerCreditHistory` serves as a permanent, immutable record of why exposure changed.
- **Global Audit Log:** The `logAudit` service tracks limit modifications, risk changes, and hold/release actions.
- **RBAC Roles (Future UI Implementation):**
  - `CUSTOMERCREDIT_VIEW`, `CUSTOMERCREDIT_MANAGE`, `CUSTOMERCREDIT_HOLD`, `CUSTOMERCREDIT_RELEASE`, `CUSTOMERCREDIT_OVERRIDE`
- **Multi-tenant Isolation:** All operations strictly enforce `companyId`.

## Future Integration (Phase 3I)
- **Invoice & Payments:** In the future Phase 3I, the exposure calculation will pivot to calculate Unpaid Invoices + Uninvoiced Deliveries, and Payments will automatically trigger `recordRelease()` to free up credit dynamically.
