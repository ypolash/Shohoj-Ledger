# MISSION

**Core Goal:**
Develop a Company Finance & Revenue Sharing CRM (Shohoj Ledger) to manage income, expenses, reserve balances, member loans, due balances, and monthly settlements. The system ensures that only paid/partial income is included in settlement, and shares are calculated properly between the CEO (40%), Developers (20%), Advisor (20%), and Company reserve (20%).

**Current Status:**

- **Last major feature added:** Upgraded the Staff Management (Employees) module to match the unified Enterprise SaaS UI system. Replaced the card-based layout with a professional list view, added top KPI metrics (Total/Active/Inactive Employees, Total Monthly Salary), comprehensive filters, and a sliding drawer for detailed employee profiles. The frontend architecture is now strictly standardized across all finance modules and staff management.
- **Next Phase:** Align the final remaining module (Leads) to this unified UI standard, and verify End-to-End Task Management and Attendance integration in the Android App.

**Goal Pivots:**

- Transitioned away from Better Auth towards a custom `jose` and `bcryptjs` JWT implementation (with backward compatibility) to support distinct Admin (User) and Employee login flows properly.
- Temporarily relaxed strict GPS constraints (radius increased to 200km) and missing Wi-Fi checks to facilitate remote development and testing off-site.

**Production Roadmap:**

- [x] Define Prisma schema and database models
- [x] Implement backend API routes for CRUD operations
- [x] Build the UI for Dashboard and core modules (Income, Expenses, Loans, Settlement)
- [x] Setup authentication (Better Auth)
- [x] Implement Monthly Settlement Logic
- [x] Setup Staff Management Models & Layout
- [x] Implement Staff Attendance & Leave Logic
- [x] Implement Payroll Processing & Deductions
- [x] Deploy to production via Coolify
- [x] Implement Lead Management Module
