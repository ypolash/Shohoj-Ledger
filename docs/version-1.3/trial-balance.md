# Enterprise Trial Balance Engine (Phase 1D)

## Architecture Overview
The Trial Balance (TB) engine is built as an aggregation layer on top of the General Ledger engine established in Phase 1C. Instead of pulling from a pre-calculated cache which is susceptible to drift, it generates mathematically perfect opening, period, and closing balances dynamically via `prisma.ledgerEntry.groupBy()` operations. 

## Calculation Flow
1. **Opening Balances**: Queries the sum of debits and credits for all entries before the `startDate`.
2. **Period Movements**: Queries the sum of debits and credits for entries strictly between `startDate` and `endDate`.
3. **Closing Balances**: Queries all entries up to `endDate`.
4. **Normal Balance Application**: Based on the `accountType` (Asset/Expense = Debit normal, Liability/Equity/Income = Credit normal), the mathematical difference is correctly assigned to the final Debit or Credit column.

## Validation
The core premise of double-entry accounting demands that Total Debits == Total Credits. The `validateTrialBalance()` method mathematically verifies this across the entire company. If this returns false, an underlying constraint in Phase 1B or the future Journal Poster was violated. 

## Dependencies
- Relies exclusively on `LedgerEntry` and `ChartOfAccount`.
- Independent of `JournalEntry` (relies purely on the final posted lines).
- Implements strict `companyId` scoping.
- Accepts `branchId` for location-specific trial balances.

## Future Financial Statements (Phase 1E Readiness)
This dynamic query engine directly unblocks Phase 1E. 
- The **Profit & Loss** report will simply filter this TB output for `INCOME` and `EXPENSE` accounts.
- The **Balance Sheet** will filter this TB output for `ASSET`, `LIABILITY`, and `EQUITY` accounts.

## Security Model
- **Tenant Isolation**: Every `groupBy` enforces `{ companyId }`.
- **RBAC**: Implemented granular permissions `TRIALBALANCE_VIEW` and `TRIALBALANCE_EXPORT`. Export functions will be linked to the global ReportAudit logger in future phases.

## Scalability Considerations
- Uses database-level aggregations (`_sum`) instead of transferring thousands of rows into Node.js memory.
- Protected by composite indexes on `LedgerEntry` (`@@index([companyId])`, `@@index([accountId])`, `@@index([entryDate])`). 
- Safe for large multi-tenant instances without triggering out-of-memory crashes on the Vercel/Node backend.
