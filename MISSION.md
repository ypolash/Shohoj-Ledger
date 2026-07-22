# MISSION.md

## Core Goal
To build a scalable, secure, and intuitive Enterprise Resource Planning (ERP) application focused on accounting, finance, inventory, and HR management (Shohoj Ledger).

## Current Status
- **Phase 6D Complete (Enterprise System Administration & Platform Operations):**
  - **Platform Architecture Extensions:** Introduced `SystemSetting`, `FeatureFlag`, and `SystemBackup` schemas to track meta-information that sits *above* individual companies.
  - **System Dashboard:** Developed the Platform Operations center showing active tenants, user counts, CPU load, and RAM telemetry across the server.
  - **Tenant Governance:** Activated `MANAGE_COMPANIES` endpoints to allow platform admins to globally suspend or reactivate companies instantly.
  - **Simulated Backups & Toggles:** Created the scaffold for triggering database backups, configuring global variables (maintenance mode, defaults), and feature flags capable of gradual rollouts.

## Goal Pivots & Architectural Decisions
- **Bypassing Tenant Boundaries By Design:** To fulfill Phase 6D's requirement of a "Platform Admin View," we specifically built `/api/system/...` endpoints that completely ignore the `where: { companyId }` filter. However, these endpoints strictly demand `SYSTEM_ADMIN` or equivalent overarching roles, preventing normal tenant admins from escaping their isolation.
- **Abstract Service Hook:** Instead of embedding Prisma inserts into every Payroll/Inventory API, we created a single `lib/notifications/notificationService.ts` that safely checks user opt-in preferences before generating rows. If an employee disables 'INVENTORY' alerts, the DB completely drops the message.
- **Double-Entry Stock Ledger:** We explicitly rejected adding a scalar `currentStock` integer to the Product table. Instead, stock is calculated dynamically from the `StockTransaction` ledger to prevent data drift and race conditions.
- **Zero RBAC/Company Breach:** Adhered strictly to `VIEW_PRODUCTS`, `MANAGE_STOCK`, `VIEW_ASSETS`, `MANAGE_ASSETS` and isolated every query by `{ where: { companyId } }`.
- Decoupled employment history into a robust `EmployeeLifecycle` timeline event model for better auditability and historical tracking instead of directly mutating all fields without record.
- Added explicit schema models `PayrollAudit` and enhanced `SalaryPayment` fields to rigidly enforce audit logging, allowing robust tracking of approvals and workflow changes while isolating companies via `companyId`.
- **Phase 4C Pivot**: Chose to layer the ledger asynchronously over existing endpoints rather than mutating the original CRUD architectures, preserving absolute backward compatibility and avoiding regression in the Attendance/HR flows.
- **Phase 4D Pivot**: Built a native client-side CSV export (`Blob`) and leveraged `window.print()` for PDF functionality instead of bringing in heavy backend dependencies, adhering to the constraint of utilizing existing export infrastructure.
- **Phase 5A Pivot**: Leveraged native HTML5 drag-and-drop instead of heavy external drag-and-drop libraries to build the Kanban pipeline, minimizing dependency bloat while delivering a premium interactive user experience.
- **Phase 5B Pivot**: Refactored the generic `Task` model to explicitly link with `Project`, and created a unified `ProjectActivity` model that elegantly handles audit logging for both Project and Task events in a single chronologically sortable feed.
- **Phase 5C Pivot**: Kept string-based `clientName` in `Project` and `companyName` in `Lead` to maintain absolute backward compatibility, while concurrently introducing strong `clientId` foreign key bindings to power the 360-degree client views.
- **Phase 5D Pivot**: Leveraged `Promise.all` in the BI aggregation API to execute 7 independent table queries concurrently, dramatically reducing latency. Reused the existing `ReportAudit` table to track executive dashboard access and exports to maintain strict security compliance.

## Production Roadmap
1. Polish UI/UX of newly added HR, Finance, Reporting, CRM, Project Management, Client Portal, and BI modules.
2. Begin Phase 6 (if any further enterprise workflows remain) or prepare for deployment.
4. Prepare for production deployment and containerization (Docker/Kubernetes).
5. Deploy to Production server.
