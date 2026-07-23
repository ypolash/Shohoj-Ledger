# Version 1.5 - Enterprise Payroll Engine

## 1. Architecture
The Enterprise Payroll Engine is exclusively an aggregation and calculation engine. Its core responsibility is to translate mathematical data from the Attendance, Leave, and existing Salary config into final monetary outputs without duplicating accounting logic.

**Core Models:**
- **`SalaryStructure` & `SalaryComponent`:** Defines template-based pay structures (e.g., Basic, House Rent, Allowances) which are bound to employees via `EmployeeSalary`.
- **`PayrollPeriod` & `PayrollRun`:** Orchestrates the temporal boundaries of a payroll cycle (Monthly, Weekly) and manages the execution states.
- **`PayrollItem` & `PayrollAdjustment`:** The calculated monetary values per employee per run. `PayrollAdjustment` allows managers to apply manual overrides (bonuses, manual deducts) to individual items.
- **`PayrollApproval`:** Enforces multi-manager sign-offs before allowing any ledger postings.
- **`PayrollSnapshot`:** Ensures strict audit compliance. When `calculatePayroll()` runs, it immediately dumps a stringified JSON snapshot of all mathematical states used (attendance data, leave balances, tax config) so that future audits can perfectly reconstruct the run, even if the underlying `SalaryStructure` is changed years later.

## 2. Calculation Flow
1. **DRAFT:** `initiatePayrollRun()` creates a new run.
2. **CALCULATING:** `calculatePayroll()` iterates through active `EmployeeSalary` records. It pulls in:
   - Fixed allowances/deductions from `SalaryComponent`.
   - Overtime totals from the Phase 4 Attendance module.
   - Unpaid Leave deductions from the Phase 5 Leave module.
3. **REVIEW:** Managers use `applyAdjustment()` to make manual changes to `PayrollItem` records. 
4. **APPROVED / REJECTED:** `approvePayrollRun()` locks the math. If rejected, it drops back to DRAFT for recalculation.

## 3. Posting Integration (Strict Boundary)
The `payrollPostingService.ts` executes the final phase of the workflow.
- **Rule:** Payroll **never** creates SQL inserts into the Accounting module (no raw Journal Entries).
- **Execution:** Once a run is APPROVED, `postPayroll()` is called. It calculates the grand totals and dispatches a JSON payload directly to the legacy `Posting Engine` (built in V1.3/V1.4). The legacy engine assumes full responsibility for creating Journal Entries mapping to Cash and Salary Expense accounts.
- The run is then marked as `POSTED` and `CLOSED`.

## 4. Security & Audit
- **Strict Isolation:** Every structure, run, and item explicitly tracks back to `{ companyId }`.
- **Role Permissions Added:** `PAYROLL_VIEW`, `PAYROLL_CREATE`, `PAYROLL_APPROVE`, `PAYROLL_POST`, `PAYROLL_REOPEN`.
- **Confidentiality:** Adjustments and Approvals require exact tracking of `approverId` ensuring absolute accountability for money transfers.
- **Immutability:** The `PayrollSnapshot` model effectively isolates historical payrolls from future policy modifications.
