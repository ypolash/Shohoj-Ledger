# MISSION.md

## Core Goal
To build a scalable, secure, and intuitive Enterprise Resource Planning (ERP) application focused on accounting, finance, inventory, and HR management (Shohoj Ledger).

## Current Status
Successfully completed **Version 1.1 — Phase 5A: Enterprise CRM & Lead Management**. 
Created a full-featured CRM module supporting complete lead lifecycles, kanban pipeline rendering, comprehensive activity logging/timelines, and dynamic dashboard analytics.

## Goal Pivots
- Shifted towards a highly modular schema for HR by separating Departments and Designations into standalone entities with references to Employee.
- Decoupled employment history into a robust `EmployeeLifecycle` timeline event model for better auditability and historical tracking instead of directly mutating all fields without record.
- Added explicit schema models `PayrollAudit` and enhanced `SalaryPayment` fields to rigidly enforce audit logging, allowing robust tracking of approvals and workflow changes while isolating companies via `companyId`.
- **Phase 4C Pivot**: Chose to layer the ledger asynchronously over existing endpoints rather than mutating the original CRUD architectures, preserving absolute backward compatibility and avoiding regression in the Attendance/HR flows.
- **Phase 4D Pivot**: Built a native client-side CSV export (`Blob`) and leveraged `window.print()` for PDF functionality instead of bringing in heavy backend dependencies, adhering to the constraint of utilizing existing export infrastructure.
- **Phase 5A Pivot**: Leveraged native HTML5 drag-and-drop instead of heavy external drag-and-drop libraries to build the Kanban pipeline, minimizing dependency bloat while delivering a premium interactive user experience.

## Production Roadmap
1. Polish UI/UX of newly added HR, Finance, Reporting, and CRM modules.
2. Begin Phase 5B (potentially deeper sales, proposals, or advanced CRM workflows).
4. Prepare for production deployment and containerization (Docker/Kubernetes).
5. Deploy to Production server.
