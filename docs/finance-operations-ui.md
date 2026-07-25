# Finance Operations UI

## Architecture
The Finance Operations module handles the day-to-day transactional interfaces of the ERP (Income, Expenses, Settlements, Funds, Reserves, Loans, and Advances). 

The module is built under `app/dashboard/finance/*` mapping seamlessly into the existing App Shell, leveraging strict Vanilla CSS for layouts.

## Domains

### 1. Income & Expenses
Provides CRUD interfaces for recording direct and indirect cash flows.
- Lists utilize `IncomeTable` and `ExpenseTable` with integrated visual status markers (Paid/Pending).
- Forms utilize standard grid layouts enforcing validation on amount, date, and category.
- Details page provides an immutable summary view (`IncomeSummary`, `ExpenseSummary`).

### 2. Settlements
Handles gateway and batch clearing (Stripe, bKash, PayPal).
- Displays gross, fees, and net calculations strictly.

### 3. Reserves & Funds
Manages restricted and unrestricted liquidity pools.
- Uses `ReserveDashboard` and `FundDashboard` (via `page.tsx` directly) to expose quick actions (Deposit, Withdraw, Transfer) and high-level balances.

### 4. Loans & Advances
Manages liabilities and prepayments.
- `LoanTable` and `AdvanceTable` expose outstanding principal vs unrecovered amounts with warning state badges.

## Component Tree
\`\`\`mermaid
graph TD
    Ops[app/dashboard/finance]
    
    Ops --> Income[income/]
    Income --> IForm[IncomeForm]
    Income --> ISummary[IncomeSummary]
    Income --> ITable[IncomeTable]

    Ops --> Expense[expenses/]
    Expense --> EForm[ExpenseForm]
    Expense --> ESummary[ExpenseSummary]
    Expense --> ETable[ExpenseTable]

    Ops --> Settlements[settlements/]
    Settlements --> STable[SettlementTable]

    Ops --> Reserves[reserves/]
    Reserves --> RDash[ReserveDashboard]

    Ops --> Funds[funds/]
    Funds --> FHistory[FundHistory]

    Ops --> Loans[loans/]
    Loans --> LTable[LoanTable]

    Ops --> Advances[advances/]
    Advances --> ATable[AdvanceTable]
\`\`\`

## Responsive Rules
- **Desktop (1400px+)**: Data tables render at full width (`min-width: 900px`).
- **Tablet (768px+)**: Tables wrap inside `overflow-x: auto` containers. Grid forms drop to 2 columns.
- **Mobile (<768px)**: `ReserveDashboard` and Flex toolbar configurations stack vertically.
