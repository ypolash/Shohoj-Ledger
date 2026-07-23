# Enterprise Accounting Core Architecture (Phase 1A)

## Architecture Overview
The Phase 1A Accounting Core establishes the strict, double-entry financial foundation that every other module (Inventory, HR, CRM) will eventually interact with. By introducing `ChartOfAccount`, `FiscalYear`, `AccountingPeriod`, and `Journal` at the foundational layer, the platform guarantees GAAP-compliant isolation of financial ledgers across multiple tenants and branches.

## Models Created
- **ChartOfAccount**: The master tree of accounts (Assets, Liabilities, Equity, Income, Expenses). Uses a self-referential `parentId` for deep hierarchies.
- **FiscalYear**: Defines the overarching company financial year, allowing historical years to be permanently closed.
- **AccountingPeriod**: Monthly/Quarterly divisions of the FiscalYear. Essential for locking down historical transactions while leaving the rest of the year open.
- **Journal**: Classifies groups of transactions (General, Sales, Purchase, Cash, Bank, Payroll) for better reporting and filtering.

## Relationships
- All models strictly relate to `Company` using `companyId` for hard tenant isolation.
- `AccountingPeriod` cascading from `FiscalYear`.
- `ChartOfAccount` self-references via `parentId` for sub-account trees.

## Future Posting Flow
In Phase 1B, the `JournalEntry` and `LedgerEntry` models will be introduced. When a user creates a Purchase Order (Inventory) or processes Payroll (HR), a backend service will automatically hook into the accounting module to generate balanced `LedgerEntry` records against the mapped `ChartOfAccount`. Direct database mutation of account balances is strictly prohibited; all balances will be calculated dynamically via SUM queries on the ledger.

## Future Integrations
- **Inventory Module**: Automatic COGS and Inventory Asset journal entries upon Stock Transfer / Sale.
- **Payroll Module**: Automatic Salary Expense and Payable entries upon Salary Payment locking.
- **CRM Module**: Automated Accounts Receivable tracking upon Invoice generation.

## Migration Strategy
- Built purely as additive schema extensions to Version 1.2. No existing data is modified or deleted.
- Preserves absolute compatibility with legacy endpoints and Android APIs.

## Risks
- Discrepancy if external modules (e.g. legacy Payroll) do not hook into the accounting engine correctly in Phase 1B.
- Tree traversal depth limit on `ChartOfAccount` if accounts nest too deeply.
