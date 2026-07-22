# MISSION.md

## Core Goal
To build a scalable, secure, and intuitive Enterprise Resource Planning (ERP) application focused on accounting, finance, inventory, and HR management (Shohoj Ledger).

## Current Status
Successfully completed **Version 1.1 — Phase 4B: Payroll Processing Workflow**. 
Implemented the advanced payroll lifecycle (Draft -> Calculated -> Submitted -> Approved -> Paid -> Locked -> Archived), Bulk Operations API, rigorous Audit Logging via the new `PayrollAudit` model, enhanced printable Payslips (with QR codes and payment details), and an analytics-driven Payroll Reports dashboard.

## Goal Pivots
- Shifted towards a highly modular schema for HR by separating Departments and Designations into standalone entities with references to Employee.
- Decoupled employment history into a robust `EmployeeLifecycle` timeline event model for better auditability and historical tracking instead of directly mutating all fields without record.
- Added explicit schema models `PayrollAudit` and enhanced `SalaryPayment` fields to rigidly enforce audit logging, allowing robust tracking of approvals and workflow changes while isolating companies via `companyId`.

## Production Roadmap
1. Polish UI/UX of newly added HR modules (Departments, Designations, Org Chart).
2. Integrate Phase 4B Finance logic and general ledger capabilities.
3. E2E Testing and performance tuning.
4. Prepare for production deployment and containerization (Docker/Kubernetes).
5. Deploy to Production server.
