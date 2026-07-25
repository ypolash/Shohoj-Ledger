# Enterprise Dashboard Architecture (Sprint UI-2)

The Enterprise Dashboard is the primary landing page after user login. It provides a dense, responsive, and tailored view of the organization's current state, broken down into modular components.

## Modularity & File Size Limits
To respect the strict 600-line limit per file, the Dashboard page (`app/dashboard/page.tsx`) acts purely as a layout assembly wrapper. Individual sections and logic are decoupled into reusable components within `app/dashboard/components/`.

### Widget Components
1. **KPICards**: High-level statistical summaries (Revenue, Expenses, Attendance, Inventory).
2. **BusinessCharts**: Visual data aggregation (Revenue vs Expense, Cash Flow, Sales Funnels) using `react-chartjs-2`.
3. **QuickActions**: Grid of immediate action shortcuts (Create Customer, Create Lead, Record Attendance).
4. **RecentActivity**: A vertical timeline component displaying cross-module events (Finance, HR, CRM, Inventory).
5. **NotificationsWidget**: A dedicated section for priority-based alerts and unread communications.
6. **TasksWidget**: Personal task lists (Overdue, Today, Upcoming, Completed).
7. **CalendarWidget**: A minimal event summary listing upcoming meetings, deadlines, and payroll cycles.
8. **RecentTables**: Specialized data grids for the latest transactions, employees, or leads.

## Role-Based Conditional Rendering
The Dashboard uses a dynamic role-aware rendering system. Widgets and their internal data conditionally appear based on the active user's role.

- **Owner**: Full visibility. Sees all widgets and all cross-module data.
- **CEO**: Broad overview. Focuses on Top KPIs, Charts, and major approvals.
- **Accountant**: Financial focus. Sees Income, Expenses, Cash Flow, and Financial Activity.
- **HR**: Personnel focus. Sees Employee statistics, Attendance, Leaves, and HR Activity.
- **Sales**: CRM focus. Sees Sales Funnels, Leads, Customer shortcuts, and CRM Activity.
- **Inventory**: Stock focus. Sees Inventory value, alerts, and stock movements.
- **Project Manager**: Project focus. Sees active projects, upcoming deadlines, and task progress.

## Aesthetics & Design System
The Dashboard strictly adheres to the established `Vanilla CSS` Design System.
- Utilizes `glass-card` and `topo-bg` classes for premium depth and texture.
- Implements CSS root variables for colors (e.g., `var(--primary)`, `var(--success-glow)`).
- Employs smooth micro-animations on hover states (especially in Quick Actions and Cards).

## Performance & Accessibility
- **Performance**: Charts are encapsulated to prevent main-thread blocking during initial render.
- **Responsiveness**: Grid layouts (`repeat(auto-fit, minmax(...))`) automatically flow from a dense multi-column desktop view to stacked cards on mobile devices.
- **Accessibility**: Semantic HTML structures and high-contrast color choices ensure screen reader compatibility and visual clarity.

*Document updated for Version 3.0 — Sprint UI-2.*
