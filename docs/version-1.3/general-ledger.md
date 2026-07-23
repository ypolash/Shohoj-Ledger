# Enterprise General Ledger Architecture (Phase 1C)

## Architecture Overview
The General Ledger (GL) is the final financial resting place for all events traversing the ERP. In Phase 1C, we established the read-only query engine. This engine respects the `companyId` boundaries while dynamically calculating running balances via on-the-fly SQL aggregation, avoiding the dangerous "data drift" associated with static balance columns.

## Ledger Flow
1. Transaction occurs in a sub-module (Inventory, HR).
2. Phase 1B creates a balanced `JournalEntry`.
3. (Future) Phase 1B/1C Post Engine explodes the `JournalEntryLine` records into immutable `LedgerEntry` rows.
4. Phase 1C Read Engine (built here) queries `LedgerEntry` to compute Trial Balances, P&L, and Balance Sheets.

## Relationships
- **Legacy Compatibility**: The new V1.3 fields (e.g., `journalEntryId`, `accountId`) were additively merged into the legacy `LedgerEntry` model via nullable fields, ensuring existing Version 1.1 / 1.2 Android API code does not crash.
- `LedgerEntry` acts as a child to `Company`, `ChartOfAccount`, `JournalEntry`, and optionally `Branch`.

## Future Posting Engine
In Phase 1D / Phase 2, the actual Posting Engine will be built. It will take an approved `JournalEntry` and write `LedgerEntry` rows inside a strictly isolated Prisma `$transaction()`.

## Future Reporting
The read-methods established (`getOpeningBalance`, `getClosingBalance`, `getRunningBalance`) are structurally prepared to serve the upcoming Trial Balance and Profit & Loss reports. By dynamically aggregating `debit` minus `credit` (respecting Account Type normalcy rules), the platform is immune to scalar balance desynchronization.

## Security Model
- All read methods inherently inject `where: { companyId }`.
- Added RBAC permissions `LEDGER_VIEW`, `LEDGER_EXPORT`, and `LEDGER_AUDIT` to control access at the API boundary layer.

## Scalability Considerations
As `LedgerEntry` will eventually contain millions of rows per tenant, proper composite indexes (`@@index([companyId])`, `@@index([accountId])`, `@@index([entryDate])`) were established to ensure blazing fast read performance during month-end closes. 
