# Enterprise Profit & Loss Engine (Phase 1E)

## Architecture Overview
The Profit & Loss (Income Statement) engine generates financial statements purely from the General Ledger, adhering strictly to the "Single Source of Truth" architectural principle. It does not look at sub-module tables (e.g., invoices or bills); it exclusively queries the immutable `LedgerEntry` facts.

## Calculation Flow
1. **Revenue Recognition**: Queries all `INCOME` type accounts. Calculates balances as `Credit - Debit` (Credit normal).
2. **Expense Recognition**: Queries all `EXPENSE` type accounts. Calculates balances as `Debit - Credit` (Debit normal).
3. **Gross Profit**: `Revenue - COGS`
4. **Operating Profit**: `Gross Profit - Operating Expenses`
5. **Net Profit**: `Operating Profit + Other Income - Other Expenses - Taxes - Interest - Depreciation`

## Future COGS & Inventory Integration
The engine is explicitly designed with placeholders for Cost of Goods Sold (COGS). When the Inventory module goes live (and posts COGS journal entries), the logic will automatically separate COGS accounts from generic Operating Expenses, instantly calculating exact Gross Profit margins.

## Security Model
- **Tenant Isolation**: Every underlying query dictates `{ companyId }`, strictly isolating multi-tenant data.
- **RBAC**: Implemented `PROFITLOSS_VIEW` and `PROFITLOSS_EXPORT` permissions. 
- **Branch Filtering**: The engine accepts a `branchId` to generate location-specific Profit & Loss statements for retail / multi-branch franchises.

## Scalability
The calculation logic is executed primarily inside the database engine using `prisma.ledgerEntry.groupBy()`. By restricting the Node.js memory footprint to just the grouped sums (one row per account) rather than thousands of ledger rows, the P&L generation remains performant and scales infinitely alongside the database.
