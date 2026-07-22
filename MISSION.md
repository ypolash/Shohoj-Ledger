# MISSION.md

## Core Goal
To build a scalable, secure, and intuitive Enterprise Resource Planning (ERP) application focused on accounting, finance, inventory, and HR management (Shohoj Ledger).

## Current Status
Successfully completed **Version 1.1 — Phase 3E: HR Organization & Employee Lifecycle Management**. 
Implemented Departments, Designations, Employee Lifecycle Events, Organization Chart, and extended HR Overview dashboards.

## Goal Pivots
- Shifted towards a highly modular schema for HR by separating Departments and Designations into standalone entities with references to Employee.
- Decoupled employment history into a robust `EmployeeLifecycle` timeline event model for better auditability and historical tracking instead of directly mutating all fields without record.

## Production Roadmap
1. Polish UI/UX of newly added HR modules (Departments, Designations, Org Chart).
2. Integrate remaining HR Phase 3 sub-modules (Attendance tracking logic, Payroll generation).
3. E2E Testing and performance tuning.
4. Prepare for production deployment and containerization (Docker/Kubernetes).
5. Deploy to Production server.
