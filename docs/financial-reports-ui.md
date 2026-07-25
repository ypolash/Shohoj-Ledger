# Financial Reports UI

## Architecture
The Financial Reports module serves as the executive summary layer for the Enterprise Finance Module. It aggregates ledger data into standard financial statements (Trial Balance, Balance Sheet, Profit & Loss, Cash Flow) and operational reports (Aging, Tax Summary). 

The module is built under `app/dashboard/finance/reports/*` to inherit the Enterprise App Shell.

## Report Hierarchy
- **Executive Dashboard** (`/reports`): Entry point displaying all available reports in a responsive grid.
- **Statements**:
  - `TrialBalanceTable`: Flat list verifying debits vs credits.
  - `BalanceSheetTree`: Hierarchical tree mapping Assets, Liabilities, and Equity.
  - `ProfitLossTable`: Multi-step income statement layout.
  - `CashFlowTable`: Categorized by Operating, Investing, and Financing activities.
- **Ledgers**:
  - `GeneralLedgerTable`: Raw chronological journal entry streams.
  - `AccountStatementTable`: Scoped ledger view for specific accounts (e.g. Cash on Hand).
- **Operations**:
  - Aging, Tax Summary.

## Core Components
- `ExportToolbar`: Standardized header for generating PDF/Excel exports and triggering print views.
- `ReportFilters`: Global controls for applying date ranges and account categories.
- `PeriodSelector`: Quick toggles for "This Month", "Last Month", "This Quarter", etc.

## Responsive Rules
- **Desktop (1400px+)**: Data tables render at full width (`min-width: 900px`).
- **Tablet (768px+)**: Tables wrap inside `overflow-x: auto` containers. Grid forms drop to 2 columns.
- **Mobile (<768px)**: Toolbars stack vertically. Action items align to start.

## Export Flow (Stubbed)
Currently, PDF, Excel, and Print buttons are visually stubbed in the `ExportToolbar`. In future sprints, these will hook into browser printing logic or server-side PDF generation.
