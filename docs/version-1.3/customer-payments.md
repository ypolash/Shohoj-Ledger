# Enterprise Customer Payments & Collections (Version 1.3 Phase 3I)

## Overview
The Enterprise Customer Payments module tracks all incoming funds from B2B customers. It acts as the receipt layer, capturing cash, bank transfers, cheques, and online payments. Crucially, it manages the concept of "Advance" and "Unallocated" balances before actual Invoices exist.

## Architecture
- **Database Models:**
  - `CustomerPayment`: The main receipt header recording the total monetary value received, payment method, and current unallocated balance.
  - `CustomerPaymentAllocation`: Granular distribution records that link fractions of a payment's total value to specific reference documents (like Sales Orders, or future Invoices).
- **Service Layer:** `lib/crm/customerPaymentService.ts` governs creation, posting, multi-target allocation, and integration with the Credit Management engine.

## Payment Lifecycle Workflow
1. **Intake (DRAFT):** Payment is logged. `unallocatedAmount` strictly matches the total `amount`.
2. **Review & Update (DRAFT):** Adjustments can be made before locking.
3. **Posting (POSTED):** The payment becomes officially recognized.
   - **Credit Impact:** Integration with Phase 3H triggers `recordRelease()`, decreasing the customer's financial exposure and freeing up their credit limit.
   - **Accounting Impact (Phase 3J/Future):** This action will instruct the `PostingService` to execute a Journal Entry debiting Bank/Cash and crediting Unearned Revenue/Customer Advances.
4. **Allocation (PARTIALLY_ALLOCATED / FULLY_ALLOCATED):**
   - Users can split the payment across multiple documents by calling `allocatePayment()`.
   - The `unallocatedAmount` decreases until it hits zero (FULLY_ALLOCATED).
5. **Cancellation (CANCELLED):** Aborts a payment, provided it has zero active allocations. Conceptually reverses credit limit relief.

## Outstanding Calculation
The system natively supports "Advance Payments". If a customer pays $10,000 but only $6,000 is allocated to a specific order, they have an outstanding unallocated balance of $4,000. `calculateCustomerBalance()` iterates all posted receipts to find exactly how much liquid cash the customer has floating on their account.

## Accounting Integration
- **Strict Separation:** The service handles the *business logic* of payment tracking. It **does NOT** write custom journal lines. 
- It relies entirely on the universal `PostingService` (implemented via Phase 1.3 Accounting Engine) to translate the business event (`POSTED`, `CANCELLED`) into compliant debits and credits.

## Audit & Security
- **Global Audit Log:** Tracks every status change, precise allocation distributions, and allocation removals.
- **Multi-tenant Isolation:** Every interaction requires `companyId`.
- **RBAC Roles (Future UI Implementation):**
  - `CUSTOMERPAYMENT_VIEW`, `CUSTOMERPAYMENT_CREATE`, `CUSTOMERPAYMENT_POST`, `CUSTOMERPAYMENT_ALLOCATE`, `CUSTOMERPAYMENT_CANCEL`

## Future Integration
- **Invoicing:** When Invoices are introduced, `CustomerPaymentAllocation` will primarily target Invoice IDs, extinguishing AR balances.
- **Collections Module:** Aging reports will leverage unallocated payment balances to offset overdue invoices dynamically.
