# Enterprise Cash Flow Engine (Phase 1G)

## Architecture Overview
The Cash Flow Statement Engine extracts insights regarding liquidity exclusively from the General Ledger. It mathematically reconciles Opening Cash and Closing Cash by tracking exactly where capital went across three distinct corporate vectors: Operating, Investing, and Financing.

## Cash Flow Calculation
The system calculates Cash Flow without ever looking at the bank accounts module directly; it purely analyzes `LedgerEntry` facts mapped to accounts dynamically classified as `CASH_EQUIVALENT`.

1. **Opening Cash**: `SUM(Debit - Credit)` of all Cash accounts prior to `startDate`.
2. **Operating Activities**: Cash flows tied to core business revenue and expenses.
3. **Investing Activities**: Cash flows tied to long-term asset acquisition/disposal.
4. **Financing Activities**: Cash flows tied to debt, equity, and dividends.
5. **Net Cash Movement**: `Operating + Investing + Financing`
6. **Closing Cash**: Independently verified by summing Cash accounts up to `endDate` to ensure `Opening Cash + Net Cash == Closing Cash`.

## Future Indirect-Method Implementation
The architecture explicitly implements structural placeholders for the **Indirect Method** of calculating Operating Cash Flow, standard under GAAP. 
In Phase 2, `getOperatingActivities` will pull Net Profit directly from the Phase 1E Profit & Loss Engine, and automatically adjust for:
- Non-cash Depreciation Adjustments
- Working Capital Changes (Delta in Accounts Receivable & Payable)
- Interest and Tax Payments (broken out separately)

## Security Model
- **Tenant Isolation**: Every backend query enforces `{ companyId }` in the Prisma `where` clause.
- **RBAC**: Implemented `CASHFLOW_VIEW` and `CASHFLOW_EXPORT` permissions to restrict access to liquidity metrics.
- **Branch Filtering**: The engine accepts a `branchId` to generate location-specific cash flow statements.

## Scalability
The calculation logic groups and sums data within PostgreSQL via `prisma.ledgerEntry.groupBy()`. This prevents out-of-memory errors on the Node server during heavy enterprise reporting periods by ensuring only lightweight aggregated totals traverse the network.
