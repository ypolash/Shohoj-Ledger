# Enterprise Purchase Requisition (Version 1.4 Phase 2)

## Architecture Overview
The Purchase Requisition (PR) module initiates the internal procurement lifecycle. It allows internal employees or departments to signal demand for goods or services. Crucially, a PR is an *internal request*, not a legal commitment to buy (which is handled by the Purchase Order).

## Database Models
The legacy `PurchaseRequest` models from V1.0 have been fully replaced with the enterprise-grade `PurchaseRequisition` schema:
1. **`PurchaseRequisition`**: The header document capturing the requestor (`User`), department, status, priority, and managerial approval signatures.
2. **`PurchaseRequisitionLine`**: Detailed line items supporting products, free-text service descriptions, required quantities, unit of measure (UOM), estimated costs, and target receiving warehouses.

## Status Workflow
A strict state machine guarantees organizational control:
- **DRAFT**: Requisition is being formulated. Lines can be added/removed.
- **SUBMITTED**: Locked by the requestor, pending managerial review.
- **UNDER_REVIEW**: Optional intermediary state for complex or high-value routing.
- **APPROVED**: Managerial sign-off achieved. Ready for procurement action.
- **REJECTED**: Sent back to the requestor with mandatory reason tracking.
- **CANCELLED**: Aborted entirely.
- **CONVERTED**: The requisition has been fully successfully transformed into an RFQ or Purchase Order.

## Priority Matrix
- **LOW / MEDIUM / HIGH / URGENT**: Determines SLA visibility in the Procurement dashboards.

## Security & RBAC
- **Tenancy:** Strict `{ companyId }` verification on all read/write database actions.
- **Roles Required:** 
  - `PURCHASEREQUISITION_VIEW`
  - `PURCHASEREQUISITION_CREATE`
  - `PURCHASEREQUISITION_UPDATE`
  - `PURCHASEREQUISITION_APPROVE` (Reserved for Department Heads or Finance)
  - `PURCHASEREQUISITION_CANCEL`

## Audit & Traceability
The module aggressively leverages the V1.3 `logAudit` engine. Every state transition (Submission, Approval, Rejection, Conversion) writes an immutable record tied to the specific user executing the action.

## Future Integrations
- **Phase 3 (Request for Quotation):** Approved PRs will be batched into RFQs. The `convertToRFQ` method sets the PR status to `CONVERTED`.
- **Budget Control:** Future finance modules will intercept the `submitRequisition` method to mathematically deduct the `estimatedCost` from departmental budgets (Soft Commitment).
