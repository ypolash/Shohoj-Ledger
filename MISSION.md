# MISSION

**Core Goal:**
Develop a Company Finance & Revenue Sharing CRM (Shohoj Ledger) to manage income, expenses, reserve balances, member loans, due balances, and monthly settlements. The system ensures that only paid/partial income is included in settlement, and shares are calculated properly between the CEO (40%), Developers (20%), Advisor (20%), and Company reserve (20%).

**Current Status:**

- **Last major feature added:** Transitioned the application to a modern enterprise SaaS design architecture using Next.js, Tailwind CSS, and shadcn/ui. Completed Phase 1 of the UI overhaul by fully redesigning the Dashboard with a new dark sidebar, top navigation, and responsive metric cards, while maintaining legacy CSS for backward compatibility of remaining modules.
- **Next Phase:** Incrementally redesign the rest of the application modules (Income, Expenses, Projects, Funds, Settlement, etc.) using the new shadcn/ui design language to achieve a premium, unified CRM experience.

**Goal Pivots:**

- Transitioned away from Better Auth towards a custom `jose` and `bcryptjs` JWT implementation (with backward compatibility) to support distinct Admin (User) and Employee login flows properly.
- Temporarily relaxed strict GPS constraints (radius increased to 200km) and missing Wi-Fi checks to facilitate remote development and testing off-site.
- **UI Pivot:** Abandoned custom vanilla CSS in favor of a robust Tailwind CSS + shadcn/ui component system to meet enterprise layout and aesthetic requirements.

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
- [x] **UI Overhaul:** Setup Tailwind CSS, shadcn/ui, and Redesign Dashboard
- [ ] **UI Overhaul:** Redesign Core Financials (Income, Expenses, Projects)
- [ ] **UI Overhaul:** Redesign Management Modules (Funds, Reserves, Settlement)
- [ ] **UI Overhaul:** Redesign Staff Operations (Attendance, Leaves, Settings)

