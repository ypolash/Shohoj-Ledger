# Supplier Payments Module

## Architecture

The **Enterprise Supplier Payments** module handles the final leg of the Procure-to-Pay (P2P) cycle. It tracks cash outflows to suppliers and allocates those payments against specific, posted Supplier Invoices. 

**CRITICAL RULE:**
Payments reduce Accounts Payable liability and reduce Cash/Bank balances via the unified Posting Engine.

## Payment Lifecycle

1. **DRAFT:** Payment is staged but not executed.
2. **POSTED:** The payment has been finalized, hitting the general ledger, but has not yet been applied to any invoices. It exists as an unallocated payment or advance.
3. **PARTIALLY_ALLOCATED:** The payment amount has been partially assigned to one or more invoices, leaving a remaining balance.
4. **FULLY_ALLOCATED:** The entire payment amount has been applied to invoices.
5. **CANCELLED:** Reverses the transaction if an error occurred.

## Allocation Workflow

A single payment can cover multiple invoices, or multiple partial payments can cover a single invoice. 
- Allocations are tracked via `SupplierPaymentAllocation`.
- Allocations strictly decrease the `unallocatedAmount` on the payment.
- Allocations can only target invoices that are in the `POSTED` status.
- Once allocations completely drain the payment's unallocated amount, it moves to `FULLY_ALLOCATED`.

## Outstanding & Balance Calculation

The system calculates realtime balances algorithmically rather than relying on stale cached values on the Supplier model.
- **Invoice Outstanding:** `Total Invoice Amount` minus `SUM(Allocations against Invoice)`.
- **Supplier Balance:** `SUM(Total Amount of POSTED Invoices)` minus `SUM(Amount of POSTED/ALLOCATED Payments)`.

## Posting Integration

Upon posting a payment (`postPayment()`), the core `PostingService` generates a journal entry.
- **Debit:** Accounts Payable (Reduces Liability)
- **Credit:** Cash/Bank Account (Reduces Asset)

*No manual journal entries are executed directly inside the procurement service.*

## Audit

The `GlobalAuditLog` tracks:
- **Payment Creation:** Draft creation.
- **Posting:** Ledger injections.
- **Allocation:** Granular assignments to specific invoices.
- **Cancellation:** Including the mandatory cancellation reason.
- **De-allocation:** Reversing an allocation back to unallocated status.

## Security

**RBAC Enforcement:**
- `SUPPLIERPAYMENT_VIEW`: Read-only access to AP payments.
- `SUPPLIERPAYMENT_CREATE`: Ability to stage draft payments.
- `SUPPLIERPAYMENT_POST`: Financial lock to push the payment to the GL.
- `SUPPLIERPAYMENT_ALLOCATE`: Specialized lock for assigning payments to invoices.
- `SUPPLIERPAYMENT_CANCEL`: Authorization to void and reverse a payment.

Tenant isolation is heavily guarded via the `companyId` constraint on every read/write.

## Future Scope
- **Payment Runs:** Batching multiple automated payments on specific days.
- **Treasury Integration:** Real-time bank balance validation before executing the GL post.
- **Bank Reconciliation:** Matching `SupplierPayment` references directly to Bank Statement feeds.
