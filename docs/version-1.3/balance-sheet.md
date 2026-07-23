# Enterprise Balance Sheet Engine (Phase 1F)

## Architecture Overview
The Balance Sheet engine renders a snapshot of the company's financial health exactly at an `asOfDate`. It ignores operational tables and constructs the snapshot purely from `LedgerEntry` facts.

## Calculation Flow
1. **Assets**: Sums all `ASSET` ledger entries up to `asOfDate`. Resolves normal balance as `Debit - Credit`.
2. **Liabilities**: Sums all `LIABILITY` ledger entries up to `asOfDate`. Resolves normal balance as `Credit - Debit`.
3. **Equity**: Sums all `EQUITY` ledger entries up to `asOfDate`. Resolves normal balance as `Credit - Debit`.

## Accounting Equation
The engine programmatically enforces the fundamental accounting law:
**`Assets = Liabilities + Equity`**
`validateBalanceSheet()` performs this exact check. If it returns false, it indicates either missing Retained Earnings logic or a catastrophic failure in the Trial Balance double-entry validation (Phase 1D).

## Future Retained Earnings Process
Currently, `retainedEarnings` is a placeholder. In Phase 2, this will be wired to dynamically calculate the cumulative `Net Profit` from the Profit & Loss Engine (all revenue minus all expenses since company inception) minus any dividend distributions. This dynamic link guarantees the Balance Sheet will always balance automatically.

## Future Inventory Valuation Integration
As the `ChartOfAccount` schema is enriched with specific classifications (Current vs Fixed Assets), the Balance Sheet Engine is structured to map the outputs into proper Current Assets (Inventory, Accounts Receivable) and Fixed Assets (Property, Plant, Equipment). Placeholders for Accumulated Depreciation, Inventory Valuation, Prepaid, and Accrued Expenses are structurally ready.

## Security Model
- **Tenant Isolation**: Every `groupBy` enforces `{ companyId }` in the Prisma `where` clause.
- **RBAC**: Implemented `BALANCESHEET_VIEW` and `BALANCESHEET_EXPORT` permissions.
- **Branch Filtering**: The engine accepts a `branchId` to generate location-specific balance sheets if needed (though typically run at the Company level).

## Scalability
Similar to the P&L Engine, the Balance Sheet Engine is optimized via `prisma.ledgerEntry.groupBy()`. Memory utilization on the server is independent of transaction volume, ensuring instant O(1) memory scaling regardless of whether the `LedgerEntry` table has a hundred rows or ten million rows.
