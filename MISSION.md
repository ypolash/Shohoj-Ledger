# MISSION.md

## Core Goal
To build a scalable, secure, and intuitive Enterprise Resource Planning (ERP) application focused on accounting, finance, inventory, and HR management (Shohoj Ledger).

## Current Status
Successfully completed **Version 1.1 — Phase 5B: Enterprise Project Management**. 
Created a comprehensive Project Portfolio Management (PPM) module enabling complex project lifecycles, kanban task boards, team assignments, budget vs actual tracking, and robust unified audit logging.

## Goal Pivots
- Shifted towards a highly modular schema for HR by separating Departments and Designations into standalone entities with references to Employee.
- Decoupled employment history into a robust `EmployeeLifecycle` timeline event model for better auditability and historical tracking instead of directly mutating all fields without record.
- Added explicit schema models `PayrollAudit` and enhanced `SalaryPayment` fields to rigidly enforce audit logging, allowing robust tracking of approvals and workflow changes while isolating companies via `companyId`.
- **Phase 4C Pivot**: Chose to layer the ledger asynchronously over existing endpoints rather than mutating the original CRUD architectures, preserving absolute backward compatibility and avoiding regression in the Attendance/HR flows.
- **Phase 4D Pivot**: Built a native client-side CSV export (`Blob`) and leveraged `window.print()` for PDF functionality instead of bringing in heavy backend dependencies, adhering to the constraint of utilizing existing export infrastructure.
- **Phase 5A Pivot**: Leveraged native HTML5 drag-and-drop instead of heavy external drag-and-drop libraries to build the Kanban pipeline, minimizing dependency bloat while delivering a premium interactive user experience.
- **Phase 5B Pivot**: Refactored the generic `Task` model to explicitly link with `Project`, and created a unified `ProjectActivity` model that elegantly handles audit logging for both Project and Task events in a single chronologically sortable feed.

## Production Roadmap
1. Polish UI/UX of newly added HR, Finance, Reporting, CRM, and Project Management modules.
2. Begin Phase 5C (potentially client portals, advanced workflows, or system configurations).
4. Prepare for production deployment and containerization (Docker/Kubernetes).
5. Deploy to Production server.
