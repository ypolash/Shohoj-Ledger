# Enterprise Accounting & Chart of Accounts UI

## Architecture
The Accounting module manages the fundamental double-entry general ledger, Fiscal Periods, and the Hierarchical Chart of Accounts.

The UI is built exclusively using our custom Vanilla CSS Component Library ensuring strict adherence to the Enterprise Design System without external library dependencies.

## Account Tree (Chart of Accounts)
- **Hierarchy Representation**: Recursive React rendering (`renderNode()`) to support N-level depth.
- **Node Interaction**: Expand/Collapse state mapped via React local state object (`Record<string, boolean>`).
- **Visuals**: Indentation scales dynamically by depth (`paddingLeft: (depth * 32 + 16) + 'px'`).
- **Data Attributes**: Real-time roll-up balances and Account Types mapped to strict badges.

## Journal UI
- **Journal Entries Table**: Provides at-a-glance status indicators (`Balanced: true/false`, `Status: Posted/Draft`).
- **Journal Form (Entry)**:
  - Supports dynamic line addition/removal using React state arrays.
  - Interactive validation computes `Total Debit`, `Total Credit`, and displays a `Difference` metric.
  - Automatically flags the Entry as valid if `Difference === 0` and total > 0.
- **Detail View (Preview)**: A structured summary of the Journal header, metadata, and immutable ledger lines.

## Fiscal Year UI
- **Structure**: Parent-child nested accordion table using `expanded` state logic to reveal child Accounting Periods.
- **Status Workflows**: Visual indicators differentiating between `Open` (Active), `Closed` (Historical, view-only), and `Locked` (Sealed from auditors).

## Component Tree
\`\`\`mermaid
graph TD
    Accounts[app/dashboard/finance/accounts]
    Accounts --> AccToolbar[AccountToolbar]
    Accounts --> AccFilters[AccountFilters]
    Accounts --> AccTable[AccountTable]
    Accounts --> AccTree[AccountTree]
    Accounts --> AccForm[AccountForm]
    Accounts --> AccSummary[AccountSummary]
    Accounts --> AccHistory[AccountHistory]

    Journal[app/dashboard/finance/journal]
    Journal --> JToolbar[JournalToolbar]
    Journal --> JFilters[JournalFilters]
    Journal --> JTable[JournalTable]
    Journal --> JEntry[JournalEntry]
    Journal --> JPreview[JournalPreview]

    Fiscal[app/dashboard/finance/fiscal-years]
    Fiscal --> PeriodToolbar[PeriodToolbar]
    Fiscal --> FYTable[FiscalYearTable]
\`\`\`

## Responsive Rules
- **Desktop (1400px+)**: Multi-column forms and deep wide tables display horizontally.
- **Laptop (1024px+)**: `AccountSummary` grid utilizes 4 columns.
- **Tablet (768px+)**: Tables adopt `overflow-x: auto`, grid forms (Journal Entry) flex down to 2 columns.
- **Mobile (<768px)**: Flex containers stack (`flex-direction: column`), grids become 1-column single-stack layouts automatically via CSS Grid.
