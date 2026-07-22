# MISSION.md

## Core Goal
To build a scalable, secure, and intuitive Enterprise Resource Planning (ERP) application focused on accounting, finance, inventory, and HR management (Shohoj Ledger).

## Current Status
- **Phase 6C Complete (Enterprise Audit Log & Activity Center):**
  - **Global Audit Engine:** Created a single `GlobalAuditLog` schema to chronologically track every module's core CRUD events across the platform.
  - **Secret Sanitization:** Developed `auditService.ts` which intercepts network headers (IP, User Agent) and automatically recursive-masks passwords, tokens, and API keys before database serialization.
  - **Activity Timeline Dashboard:** Built a highly filterable UI supporting cross-module JSON deep dives and JSON diffs.
  - **Export Framework:** Bound to the `EXPORT_AUDIT` RBAC role to strictly regulate raw CSV generation.

## Goal Pivots & Architectural Decisions
- **Non-Destructive Integration:** To obey strict backward-compatibility rules on older modules, the `GlobalAuditLog` operates as a parallel hook (`logAudit()`). Modules don't need to be rewritten to support the global log; they simply invoke the fire-and-forget service.
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
