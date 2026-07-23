# Enterprise Sales Commission Engine (Version 1.3 Phase 3J)

## Overview
The Enterprise Sales Commission Engine bridges CRM actions (Sales Orders, Payments) with human resource incentives without entangling CRM models directly into Payroll. It establishes clear `CommissionPolicy` thresholds and evaluates CRM transactions mathematically to queue rewards.

## Architecture
- **Database Models:**
  - `CommissionPolicy`: Defines the ruleset for a commission (`PERCENTAGE`, `FIXED_AMOUNT`, etc.), minimum targets, and maximum caps.
  - `SalesCommission`: The resulting record of applying a policy to a CRM document (like a `SalesOrder` or a `CustomerPayment`). It tracks the generated `commissionAmount`.
- **Service Layer:** `lib/crm/commissionService.ts` governs the creation, validation, recalculation, and approval of commissions.

## Calculation Types Supported
- `PERCENTAGE`: standard fractional cut of the base amount.
- `FIXED_AMOUNT`: static bonus upon achieving the sale.
- *Future Expansions:* `TIERED` and `TARGET_BASED` schemas are reserved for future phases but exist in the `CalculationType` enum.

## Approval Workflow
1. **Creation (CALCULATED):** The system automatically (or manually via trigger) evaluates a `SalesOrder` or `CustomerPayment` and creates a `SalesCommission` record if a policy applies.
2. **Review:** Managers can review the queued commissions. If the base amount changes (e.g., an order is partially cancelled), `recalculateCommission()` adjusts the math.
3. **Approval (APPROVED):** A manager approves the commission. It is locked and frozen.
4. **Payroll Hook (PAID):** In the future, the Payroll Engine will query all `APPROVED` commissions, inject them into employee payslips, and hit the `markPaid()` API to close the lifecycle.

## Accounting & Payroll Integration
- **Strict Separation:** The Sales Commission Engine handles the *business logic* of evaluating sales. It **does NOT** write custom journal lines for commission expense or accrued liabilities yet. 
- It also **does NOT** write into the HR/Payroll tables (`Payslip`, `SalaryPayment`). It purely prepares a queue of `APPROVED` records that Payroll modules can safely consume when they process a cycle.

## Audit & Security
- **Global Audit Log:** Tracks every status change, manual recalculations, and managerial approvals.
- **Multi-tenant Isolation:** Every interaction requires `companyId`.
- **RBAC Roles (Future UI Implementation):**
  - `COMMISSION_VIEW`, `COMMISSION_MANAGE`, `COMMISSION_APPROVE`, `COMMISSION_REPORT`
