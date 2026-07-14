# GSD Implementation Plan: Shohoj Ledger

This plan outlines the end-to-end implementation for the Company Finance & Revenue Sharing CRM based on `SPEC.md` and the existing database schema.

## Phase 1: Project Scaffolding & Core Architecture

- [x] **1.1 Next.js Setup:** Initialize `package.json` with Next.js 15, React 19, and required dependencies.
- [x] **1.2 Database Infrastructure:** Create `docker-compose.yml` for PostgreSQL 16 and apply initial Prisma migrations (`npx prisma migrate dev`).
- [x] **1.3 Authentication:** Install and configure Better Auth for session management.
- [x] **1.4 UI Foundation:** Set up Vanilla CSS / CSS Modules for the design system (Premium UI, dark mode support).

## Phase 2: Core Financial Operations (Income & Expenses)

- [x] **2.1 Income API & UI:** Implement `/api/income` to record payments. Enforce logic to track both full and partial payments.
- [x] **2.2 Expense API & UI:** Implement `/api/expenses` with approval status workflow.
- [x] **2.3 Project Tracking:** Implement `/api/projects` to link income and expenses for profitability tracking.

## Phase 3: Funds, Reserves & Advances

- [x] **3.1 Add Fund System:** Implement API and UI for adding non-shareable funds and owner contributions.
- [x] **3.2 Reserve Balance Tracking:** Track company shares and manual adjustments to the reserve balance.
- [x] **3.3 Member Loans:** Implement `/api/loans` with 6-month overdue logic.
- [x] **3.4 Due/Advance Balances:** Implement `/api/advances` to deduct from future settlements.

## Phase 4: Monthly Settlement Engine (The Core Logic)

- [x] **4.1 Settlement Service:** Build the core math engine.
  - Fetch only PAID/PARTIAL income for the period.
  - Deduct APPROVED expenses.
  - Apply category-based distribution (e.g., Development: CEO 40%, Dev 20%, Co 40%).
  - Auto-deduct active advance due balances from individual shares.
- [x] **4.2 Settlement Execution:** Auto-transfer the "Company" portion to the Reserve Balance.
- [x] **4.3 Settlement UI:** Build the interface to preview, approve, and finalize monthly payouts.

## Phase 5: Dashboard & Reporting

- [x] **5.1 Overview Dashboard:** Aggregate metrics for total cash flow, reserve balance, and outstanding loans.
- [ ] **5.2 Project Profitability:** Detailed view of income vs. expenses per project.

## Phase 6: Production & Security

- [ ] **6.1 Backup Automation:** Setup MinIO scripts for weekly backups and daily Postgres dumps.
- [ ] **6.2 Coolify Deployment:** Finalize Docker configuration and environment variables for live server deployment.
