# MISSION

**Core Goal:**
Develop a Company Finance & Revenue Sharing CRM (Shohoj Ledger) to manage income, expenses, reserve balances, member loans, due balances, and monthly settlements. The system ensures that only paid/partial income is included in settlement, and shares are calculated properly between the CEO (40%), Developers (20%), Advisor (20%), and Company reserve (20%).

**Current Status:**

- **Last major feature added:** Fixed production deployment by generating and applying missing Prisma migrations, allowing the Coolify environment to synchronize with the new schema (Members, Staff Management, etc.). The dashboard advances page and other components now successfully load without 500 errors.
- **Next Phase:** Address any remaining hydration issues and ensure proper functioning of Staff Management workflows.

**Goal Pivots:**
N/A (Initial Setup)

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

