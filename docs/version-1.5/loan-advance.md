# Version 1.5 - Enterprise Loan & Advance Management

## 1. Architecture
The Loan & Advance Management module is responsible for administering internal financial assistance to employees. The models explicitly separate multi-month structured Loans from short-term single/partial-deduction Salary Advances.

**Core Models:**
- **`EmployeeLoan` & `EmployeeLoanInstallment`:** Designed for multi-month structured assistance. Features total tracking of principal, interest, issue date, and an explicit breakdown of monthly installments.
- **`SalaryAdvance` & `SalaryAdvanceRecovery`:** Designed for bulk/one-off payroll deductions or ad-hoc cash recoveries. A `SalaryAdvance` is fully settled once `recoveries.sum(amount) >= advance.amount`.

## 2. Recovery Workflow
1. **Creation & Approval:** A loan/advance is created, and an explicit approval status (`APPROVED`) is granted by a manager.
2. **Issuance:** `issueLoan()` / `issueAdvance()` activates the entity. At this exact moment, a handoff webhook/payload is triggered to the **Posting Engine** to legally document the Cash disbursement to the employee.
3. **Recovery:**
   - **Payroll Integration (Automated):** During Phase 6's `calculatePayroll()`, the Payroll engine reads active `EmployeeLoanInstallment` due in that period, and active `SalaryAdvance` records. It deducts the amounts from the Gross Salary.
   - **Post-Payroll Execution:** Once the Payroll is `POSTED`, a background hook calls `recoverLoan()` and `recoverAdvance()` with the `payrollReference` attached, permanently closing out that installment/balance.
   - **Manual Recovery:** The services also support manual cash recoveries outside of payroll, hitting the Posting Engine independently for Cash receipt entries.

## 3. Posting Integration (Strict Boundary)
The `loanService.ts` and `advanceService.ts` enforce the universal accounting rule:
- HR/Payroll **never** creates SQL inserts into the Accounting module directly.
- **Execution:** When `issueLoan()`, `issueAdvance()`, `recoverLoan()`, or `recoverAdvance()` is successfully executed within a transaction, a structured JSON payload is immediately transmitted to the legacy `Posting Engine` (built in V1.3/V1.4) which bears full responsibility for the double-entry accounting logic.

## 4. Security & Audit
- **Strict Isolation:** Every loan and advance explicitly tracks back to `{ companyId }` ensuring complete multi-tenant boundaries.
- **Role Permissions Added:** `LOAN_VIEW`, `LOAN_CREATE`, `LOAN_APPROVE`, `LOAN_RECOVER`, `ADVANCE_VIEW`, `ADVANCE_CREATE`, `ADVANCE_APPROVE`, `ADVANCE_RECOVER`.
- **Accountability:** `approvedById` is mandatorily captured on all loans to trace executive authorizations.
- **Audit Logging:** Implemented tracking through distinct `EmployeeLoanInstallment` and `SalaryAdvanceRecovery` ledger entities, so no scalar total is ever manipulated without an underlying mathematical reason.
