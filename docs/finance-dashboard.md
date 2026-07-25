# Enterprise Finance Dashboard

## Architecture

The Enterprise Finance Dashboard serves as the central CFO landing view, bringing together critical financial insights in a single, high-density dashboard.

### Core Objectives
1. **Executive Overview**: Immediate visibility into liquidity, profitability, and operational costs.
2. **Performance Tracking**: Budget utilization and revenue targets compared dynamically.
3. **Responsive Design**: Modular component architecture matching `ui-dashboard-layout.md` ensuring scalability down to mobile.
4. **Dependency-free Visuals**: Fully custom charts using SVG and CSS Grid/Flexbox matching the existing app performance constraints (no Chart.js).

---

## Widget Tree

\`\`\`mermaid
graph TD
    Dashboard[app/dashboard/finance/page.tsx]
    Dashboard --> Toolbar[FinanceToolbar]
    Dashboard --> Filters[FinanceFilters]
    Dashboard --> KPICards[FinanceKPICards]
    
    Dashboard --> Row1[Top Widgets Grid]
    Row1 --> Revenue[RevenueWidget]
    Row1 --> Expense[ExpenseWidget]
    Row1 --> CashFlowW[CashFlowWidget]
    Row1 --> ProfitLoss[ProfitLossWidget]

    Dashboard --> Row2[Main Charts & Summaries]
    Row2 --> IncExpChart[IncomeExpenseChart]
    Row2 --> CFChart[CashFlowChart]
    Row2 --> RevTrend[RevenueTrendChart]
    Row2 --> ExpTrend[ExpenseTrendChart]

    Dashboard --> Row3[Tables & Detail Views]
    Row3 --> AccBal[AccountBalanceTable]
    Row3 --> BalWidget[BalanceWidget]
    Row3 --> RecTx[RecentTransactions]
    Row3 --> OutWidget[OutstandingWidget]
    
    Dashboard --> Row4[Footers]
    Row4 --> FinSum[FinancialSummary]
    Row4 --> BudSum[BudgetSummary]
    Row4 --> QActions[FinanceQuickActions]
\`\`\`

---

## Charts (SVG & CSS)

All visualizations are fully custom to prevent third-party bundle bloat.
- **Income vs Expense**: CSS Flexbox columns with calculated percentage heights.
- **Cash Flow Waterfall**: Absolute positioned CSS divs mapping sequential running balances.
- **Revenue/Expense Trends**: SVG Polylines mapped across 0-100 viewBox grids.
- **Budget Summary**: Horizontal CSS progress bars with dynamic color coding based on threshold limits.

---

## Responsive Rules
- **Desktop (1400px+)**: All charts display side-by-side in grids (`grid-template-columns: repeat(auto-fit, minmax(380px, 1fr))`).
- **Laptop (1024px+)**: `FinanceKPICards` wraps naturally using `minmax(200px, 1fr)`.
- **Tablet (768px+)**: Tables adopt `overflow-x: auto` to prevent viewport break.
- **Mobile (<768px)**: Flex containers and grids fall back to 1-column single-stack layouts automatically via CSS Grid.

---

## Theme Support
All components exclusively use semantic CSS variables mapped in `globals.css` (e.g., `var(--bg-main)`, `var(--primary)`, `var(--surface-hover)`) guaranteeing zero modification needed for Light/Dark mode toggling.
