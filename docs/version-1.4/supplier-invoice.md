# Supplier Invoice & Three-Way Matching Module

## Architecture

The **Enterprise Supplier Invoice** module manages the financial obligations generated through the procurement process. It bridges the gap between Physical supply chain (GRN) and Corporate Finance (General Ledger).

**CRITICAL RULE:**
The Supplier Invoice is the **FIRST** procurement document allowed to create an accounting entry via the Posting Engine.

## Three-Way Matching

The system automates the classical Three-Way Match by comparing:
1. **Purchase Order (Expected):** The agreed-upon price and quantity from the supplier.
2. **Goods Receipt Note (Physical):** The actual quantity received and inspected by the warehouse.
3. **Supplier Invoice (Financial):** The billed amount and quantity requested by the supplier.

The `ThreeWayMatch` model executes an algorithmic comparison during invoice approval. It flags quantities billed that exceed received quantities (`QUANTITY_MISMATCH`) and prices billed that differ from the purchase order (`PRICE_MISMATCH`).

## Variance Handling

If a mismatch is detected, the `ThreeWayMatch` status drops into `PENDING_REVIEW`.
- Variances are quantified by `varianceAmount`.
- A minor tolerance check (e.g. $5.00) allows insignificant discrepancies to pass automatically.
- Severe mismatches require a manager with the `THREEWAYMATCH_APPROVE` permission to execute `approveVariance()`, providing a mandatory remark detailing why the mismatch is being accepted.

## Posting Integration

Upon final approval of the Supplier Invoice (and successful Three-Way Match resolution), the `postInvoice()` method engages the core `PostingService`.
- No raw journal entries are generated manually within the procurement module.
- The service maps structural data into the `postJournalEntry` function:
  - **Debit:** GRNI / Inventory Clearing
  - **Credit:** Accounts Payable
  - Support integrated for tax and shipping allocation entries.

## Audit

The `GlobalAuditLog` traces the lifecycle securely:
- **Invoice Creation:** Tracks `CREATE`.
- **Three-Way Match:** Tracks the execution of the match, documenting the resulting variance status and amount.
- **Approvals:** Logs managerial overrides for variance approvals and final invoice approvals.
- **Posting:** Logs the exact moment the invoice is pushed to the General Ledger.

## Security

**RBAC Enforcement:**
- `SUPPLIERINVOICE_VIEW`: Read-only access to historical AP documents.
- `SUPPLIERINVOICE_CREATE`: Create draft invoices from received bills.
- `SUPPLIERINVOICE_APPROVE`: Managerial lock for approving standard invoices.
- `SUPPLIERINVOICE_POST`: Financial controller lock allowing ledger injection.
- `THREEWAYMATCH_APPROVE`: Specialized lock for resolving and overriding mismatched variances.

Tenant isolation is strictly enforced via the `companyId` parameter across all repository and service boundaries.
