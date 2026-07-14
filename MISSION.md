# MISSION

**Core Goal:**
Develop a Company Finance & Revenue Sharing CRM (Shohoj Ledger) to manage income, expenses, reserve balances, member loans, due balances, and monthly settlements. The system ensures that only paid/partial income is included in settlement, and shares are calculated properly between the CEO (40%), Developers (20%), Advisor (20%), and Company reserve (20%).

**Current Status:**

- **Last major feature added:** Initiated Phase 6 (Staff Management module). Created Prisma models for Employee, Attendance, LeaveRequest, Payroll, Bonuses, and Payslips. Integrated the Admin Staff Dashboard into the layout and built the Employee Portal (/staff) foundations.
- **Next Phase:** Phase 6 (Staff Management module) - Complete Attendance rules (late deductions), Leave approvals, and Payroll generation engine, followed by integration with the Expense module.

**Goal Pivots:**
N/A (Initial Setup)

**Production Roadmap:**

- [x] Define Prisma schema and database models
- [x] Implement backend API routes for CRUD operations
- [x] Build the UI for Dashboard and core modules (Income, Expenses, Loans, Settlement)
- [x] Setup authentication (Better Auth)
- [x] Implement Monthly Settlement Logic
- [x] Setup Staff Management Models & Layout
- [ ] Implement Staff Attendance & Leave Logic
- [ ] Implement Payroll Processing & Deductions
- [ ] Deploy to production via Coolify
