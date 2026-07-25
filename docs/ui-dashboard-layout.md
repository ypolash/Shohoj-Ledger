# Dashboard Layout Planning

The dashboards in Shohoj Ledger are role-specific, providing immediate operational context and quick actions.

## 1. Universal Dashboard Standards
- **Greeting & Context:** Top left (e.g., "Good morning, Admin. Here is your overview for Today.")
- **Date Range Picker:** Top right (Default: This Month).
- **KPI Row:** The top row is always reserved for 4-5 high-level KPI cards.
- **Main Chart Area:** The middle section contains trend lines or bar charts.
- **Activity/List Area:** The bottom or side section contains recent transactions or actionable tasks.

---

## 2. Role-Specific Dashboards

### Owner / CEO Dashboard
- **Focus:** High-level financials and business health.
- **KPIs:** Gross Revenue, Net Profit, Cash at Bank, Total Receivables.
- **Charts:** Revenue vs Expenses (6-month trend), Sales Pipeline Funnel.
- **Widgets:** Top 5 Customers, Pending Executive Approvals.

### Accountant Dashboard
- **Focus:** Cash flow, payables, receivables, and reconciliation.
- **KPIs:** Accounts Receivable (AR), Accounts Payable (AP), Unreconciled Transactions, Cash Burn Rate.
- **Charts:** Cash Flow Forecast, Expense Breakdown (Pie).
- **Widgets:** Invoices Overdue, Pending Journals.

### HR Manager Dashboard
- **Focus:** Personnel, attendance, and recruitment.
- **KPIs:** Total Headcount, Today's Absenteeism Rate, Open Job Requisitions, Pending Leave Requests.
- **Charts:** Headcount Growth, Department Breakdown.
- **Widgets:** Today's Birthdays, Upcoming Anniversaries, Pending Onboarding.

### Sales Manager Dashboard
- **Focus:** Pipeline velocity and target achievement.
- **KPIs:** Opportunities Won, Win Rate, Expected Revenue (Pipeline), Average Deal Size.
- **Charts:** Sales by Rep (Bar), Target vs Actual.
- **Widgets:** Recent Won Deals, Stagnant Opportunities.

### Inventory Manager Dashboard
- **Focus:** Stock levels, movement, and fulfillment.
- **KPIs:** Total Stock Value, Low Stock Alerts, Pending Deliveries, Return Rate.
- **Charts:** Stock Movement Volume (In vs Out).
- **Widgets:** Items below Reorder Level, Pending Purchase Orders to Receive.

### Project Manager Dashboard
- **Focus:** Delivery, tasks, and team utilization.
- **KPIs:** Active Projects, Tasks Overdue, Billable Hours, Team Utilization %.
- **Charts:** Burn-down charts for active sprints, Resource Allocation.
- **Widgets:** My Tasks, Blocked Issues.

---

## 3. Widget Interactivity
- **Drill-down:** Clicking a KPI card (e.g., "12 Overdue Invoices") immediately redirects to the filtered list view of those specific records.
- **Quick Actions:** Dashboards must include a floating or sticky "Quick Action" menu (e.g., "+ New Invoice", "+ Record Payment").
