# Enterprise Journal Entry Engine (Phase 1B)

## Architecture Overview
The Journal Entry Engine serves as the core transactional router for all financial events within the ERP. It captures double-entry accounting events from every module (Purchase, Sales, Payroll) and translates them into balanced Debits and Credits. 

## Models Built
- **JournalEntry**: Represents the voucher or transaction header. Enforces isolation via `companyId` and optionally `branchId`. Tracks the lifecycle from DRAFT to POSTED.
- **JournalEntryLine**: Contains the specific debit or credit against a specific `ChartOfAccount`.

## Journal Lifecycle
1. **DRAFT**: The entry is being constructed (e.g., adding multiple debit/credit lines). It holds no financial weight.
2. **POSTED**: The entry has been validated, approved, and locked. It is now part of the financial ledger.
3. **VOID**: The entry was cancelled after creation. Reversals may be necessary depending on strict compliance settings.
4. **CANCELLED**: The entry was cancelled before posting.

## Validation Rules Implemented
The `validateEntry()` method strictly enforces GAAP rules before an entry can be submitted for posting:
- **Balance Verification**: `SUM(debits)` must exactly equal `SUM(credits)`.
- **Minimum Lines**: Double-entry requires at least one debit line and one credit line (total >= 2).
- **Account Validity**: Ensures no lines hit an inactive account.
- **Period Locking**: Queries `AccountingPeriod` to verify the transaction `entryDate` falls within a currently open period.

## Security Model
- **Tenant Isolation**: Every service call enforces `{ where: { companyId } }`. Cross-company posting is impossible.
- **RBAC**: Implemented granular permissions `JOURNALENTRY_VIEW`, `JOURNALENTRY_CREATE`, `JOURNALENTRY_EDIT`, `JOURNALENTRY_POST`, and `JOURNALENTRY_VOID`.

## Future Posting Process (Phase 1C Readiness)
This phase deliberately stops short of posting to the ledger. In Phase 1C, the `submitForPosting` method will be expanded to asynchronously hook into the `LedgerEntry` engine, dynamically aggregating balances without mutating scalar totals, preserving absolute data integrity.
