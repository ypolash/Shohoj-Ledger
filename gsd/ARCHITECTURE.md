# System Architecture

## Technology Stack
- **Frontend**: Next.js 15, React 19, Vanilla CSS (CSS Modules) with Premium Enterprise UI design tokens.
- **Backend**: Next.js Server Actions & API Routes.
- **Database**: PostgreSQL 16 via Prisma ORM.
- **Authentication**: Better Auth with Iron Session (cross-app compatibility).
- **Mobile Apps**: Standalone PWA Staff App (Next.js 16) + Native Android App (Kotlin/Jetpack Compose).

## Design Patterns
- **Layered Architecture**: Controller (API Routes) -> Service Layer -> Repository (Prisma).
- **Strict Tenant Isolation**: Enforced via `companyId` row-level security and `systemSource` origin validation.
- **Event-Driven**: Background worker tasks for Notifications, Approvals, and Webhooks.
- **Conceptual UI Isolation**: Separation of `/dashboard` (legacy fast-paced workflow) and `/erp` (enterprise hierarchical workflow).
- **Modularity**: Strict 600-line limit rule per file to force component extraction.

## Key Components
- **Finance Engine**: Double-entry accounting, immutable ledger entries.
- **HR & Payroll Engine**: Immutable snapshots, hierarchical approvals, fine/penalty automation.
- **Procurement & Inventory**: FIFO valuation, isolated reservation-based stock workflows.
- **Staff ESS**: Dedicated backend endpoints (`/api/ess/*`) exposing profile, attendance, and payroll records to mobile clients.

## Infrastructure & Deployment
- **Containerization**: Docker Compose
- **Platform**: Coolify
- **Storage/Backups**: MinIO with automated Postgres dumps and retention policies.
