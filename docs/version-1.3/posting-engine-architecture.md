# Posting Engine Architecture (Phase 1H-A)

## 1. Architectural Overview
The Posting Engine is the central nervous system connecting operational modules (Sales, HR, Inventory) to the General Ledger. It acts as a strict, idempotent gateway ensuring that every business event is translated into a balanced double-entry `JournalEntry` and subsequently exploded into immutable `LedgerEntry` rows.

## 2. Voucher Numbering Strategy
Voucher numbering must be strictly sequential, human-readable, and globally unique per tenant to meet audit and compliance requirements.
- **Format**: `[COMPANY]-[BRANCH]-[YEAR]-[TYPE]-[SEQ]`
- **Example**: `C1-HQ-2026-JV-00014`
- **Components**:
  - **Company/Branch Prefix**: Ensures visual identification of the tenant/location.
  - **Fiscal Year**: Resets the sequence automatically at the start of a new fiscal year.
  - **Type**: Defines the source (JV: Journal Voucher, SI: Sales Invoice, PI: Purchase Invoice, SP: Salary Payment).
  - **Sequence**: A padded integer generated via a highly concurrent atomic incrementer (e.g., PostgreSQL sequence or Redis atomic counter) to avoid race conditions.

## 3. Reversal Strategy
To maintain absolute audit integrity, posted `LedgerEntry` rows are strictly **immutable**.
- **Correction Journal**: If a minor mistake is made (e.g., wrong department tag), a secondary journal is posted transferring the balance to the correct account.
- **Reverse Journal (Voiding)**: If a transaction is cancelled, the system creates a *new* Journal Entry with the exact inverse debits and credits. The original entry status is marked as `VOIDED`, and the new entry is linked via `referenceId` pointing to the original voucher. This ensures the historical ledger always balances and reflects the reality of the error and its correction.

## 4. Audit Trail
Every posting operation must be perfectly traceable.
- **Who**: `createdById` and `approvedById` fields map strictly to the `User` performing the action.
- **When**: `createdAt` on the Journal Entry, and `entryDate` representing the effective accounting date.
- **Source Module**: Defined by `referenceType` (e.g., `SALES_INVOICE`, `PAYROLL_RUN`).
- **Reference Document**: Defined by `referenceId` (e.g., the UUID of the specific `SalesInvoice` record).

## 5. Idempotency Strategy
To prevent double-posting (e.g., a user clicking "Approve" twice, or a network timeout causing a retry):
- The `JournalEntry` model has a `@@unique([companyId, entryNumber])` constraint.
- The service layer will accept an `idempotencyKey` parameter. If a request arrives with an existing key, the engine will safely return the existing `JournalEntry` rather than creating a duplicate.
- Operational records (like a `PurchaseOrder`) will have a `journalEntryId` foreign key. Before posting, the system will verify this field is null.

## 6. Error Recovery
- **Database Transactions**: All Ledger and Journal operations will be wrapped in a single Prisma `$transaction`. If any step fails (e.g., unbalanced debits), the entire operation rolls back.
- **Failed Queue**: For background automated postings (e.g., nightly depreciation), failed jobs will be pushed to a Dead Letter Queue (DLQ).
- **Manual Intervention**: The DLQ will surface in an Admin "Posting Errors" UI, allowing a financial controller to review the error (e.g., "Account Inactive"), fix the mapping, and click "Retry Posting".
