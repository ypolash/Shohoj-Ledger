# MISSION.md

## Core Goal
To build a scalable, secure, and intuitive Enterprise Resource Planning (ERP) application focused on accounting, finance, inventory, and HR management (Shohoj Ledger).

## Current Status
Successfully completed **Version 1.1 — Phase 4C: Accounting & Ledger Integration**. 
Implemented the unified Accounting Engine (`LedgerEntry`), hooked it dynamically into all transactional modules (Income, Expense, Payroll, Loans, Advances, Reserves, Funds), and built a central Unified General Ledger View alongside a Financial Overview dashboard.

## Goal Pivots
- Shifted towards a highly modular schema for HR by separating Departments and Designations into standalone entities with references to Employee.
- Decoupled employment history into a robust `EmployeeLifecycle` timeline event model for better auditability and historical tracking instead of directly mutating all fields without record.
- Added explicit schema models `PayrollAudit` and enhanced `SalaryPayment` fields to rigidly enforce audit logging, allowing robust tracking of approvals and workflow changes while isolating companies via `companyId`.
- **Phase 4C Pivot**: Chose to layer the ledger asynchronously over existing endpoints rather than mutating the original CRUD architectures, preserving absolute backward compatibility and avoiding regression in the Attendance/HR flows.

## Production Roadmap
1. Polish UI/UX of newly added HR and Finance modules.
2. Build specific Tax and Compliance reporting systems if required.
4. Prepare for production deployment and containerization (Docker/Kubernetes).
5. Deploy to Production server.
