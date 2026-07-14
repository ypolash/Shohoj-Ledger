# MISSION

**Core Goal:**
Develop a Company Finance & Revenue Sharing CRM (Shohoj Ledger) to manage income, expenses, reserve balances, member loans, due balances, and monthly settlements. The system ensures that only paid/partial income is included in settlement, and shares are calculated properly between the CEO (40%), Developers (20%), Advisor (20%), and Company reserve (20%).

**Current Status:**

- **Last major feature added:** Updated profit sharing conditions to include a new Advisor (Shafaeath Hosen) with a 20% share. The new flat share structure is 40% CEO, 20% Developer, 20% Advisor, and 20% Company.
- **Next Phase:** Phase 6 (Production & Security), focusing on database backup automation via MinIO and system hardening.

**Goal Pivots:**
N/A (Initial Setup)

**Production Roadmap:**

- [x] Define Prisma schema and database models
- [ ] Implement backend API routes for CRUD operations
- [ ] Build the UI for Dashboard and core modules (Income, Expenses, Loans, Settlement)
- [x] Setup authentication (Better Auth)
- [ ] Implement Monthly Settlement Logic
- [ ] Deploy to production via Coolify
