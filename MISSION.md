# MISSION.md

## Core Goal
To build a scalable, secure, and intuitive Enterprise Resource Planning (ERP) application focused on accounting, finance, inventory, and HR management (Shohoj Ledger).

## Current Status
- **Version 1.2 Enterprise Readiness (Phases 0-9 Complete):**
  - **Database Migration Released**: Applied architecture models for Workflow Engine, Approval Engine, Advanced Reporting, Notification Center, API Platform, Multi-Branch, Advanced Inventory, and AI Analytics.
  - **Tenant Safety Audited**: Hard isolation via `companyId` enforced across all new tables.
  - **Zero Downtime Deployed**: All v1.2 migrations applied purely additively without breaking v1.1 UI or Android flows.

## Goal Pivots & Architectural Decisions
- **Dark Release Strategy (Version 1.2):** Implemented all schema foundations for enterprise modules (Phases 1-9) without wiring them to the UI immediately. This allows for safe, gradual frontend implementation without database bottlenecks.
- **Additive Extension over Replacement:** Reused existing tables (`Warehouse`, `Supplier`, `PurchaseOrder`) by safely appending nullable fields rather than breaking legacy v1.1 structures.
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
1. **Version 1.2 UI Rollout:** Build out the Frontend Next.js interfaces for Workflow Designers, Report Builders, Branch Settings, and Webhook dashboards.
2. **Background Queue Implementation:** Deploy the Node.js worker scripts that will drain the `NotificationQueue` and `AnalyticsSnapshot` jobs.
3. **AI Pipeline Engineering:** Connect `BusinessInsight` and `ForecastRecord` tables to LLM/ML pipelines for nightly processing.
4. Scale production containers to handle upcoming Version 1.2 background workers.
