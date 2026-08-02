# GSD Implementation Plan: Shohoj ERP (V5.0)

This plan outlines the final stages for the colossal Shohoj Ledger Enterprise ERP system. All previous MVP and V1.3-V5.0 milestones (documented in `MISSION.md`) have been successfully executed and approved.

## Phase 1: Technical Debt & DRY Refactoring (Current Phase)
- [ ] **1.1 Refactor Settlement Module**: Extract shared components to resolve the 600-line limit violations and duplication between `/erp/settlement/page.tsx` and `/dashboard/settlement/page.tsx`.
- [ ] **1.2 Refactor Payroll Module**: Extract shared components for `/erp/staff-management/payroll/page.tsx` and `/dashboard/staff-management/payroll/page.tsx`.
- [ ] **1.3 Refactor Employees Module**: Extract shared components for `/erp/staff-management/employees/page.tsx` and `/dashboard/staff-management/employees/page.tsx`.

## Phase 2: Production & Security Deployment
- [x] **2.1 Backup Automation:** Setup MinIO scripts for weekly backups and daily Postgres dumps.
- [ ] **2.2 Docker & Coolify Deployment:** Finalize `docker-compose.yml` and environment variables for the live production server deployment.
