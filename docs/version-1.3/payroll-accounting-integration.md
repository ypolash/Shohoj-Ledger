# Payroll ↔ Accounting Integration (Phase 1J)

## Architecture Overview
Similar to Inventory, the Payroll module operates as a strict client of the Phase 1H Automatic Posting Engine. Payroll administrators manage salaries, attendance, and deductions in their own isolated domain. When a payroll run is finalized, the `payrollAccountingService` automatically translates the HR metrics into standard double-entry `PostingRequest` payloads.

## Supported Event Flows

### 1. Salary Accrual (Payroll Run Finalization)
When the monthly payroll batch is approved (but before cash is disbursed):
- **Debit**: Salary Expense (Gross Salary)
- **Debit**: Employer Tax Expense (Company Contributions)
- **Credit**: Tax & Withholding Liabilities (Employee + Employer portions)
- **Credit**: Net Salary Payable (Liability to Employees)

### 2. Salary Payment
When cash is actually transferred to employees:
- **Debit**: Net Salary Payable
- **Credit**: Cash / Bank

### 3. Bonus / Allowance
When spot bonuses or stipends are issued:
- **Debit**: Bonus / Allowance Expense
- **Credit**: Cash / Bank

### 4. Loan Recovery
When an employee repays a company advance or loan out of their paycheck:
- **Debit**: Cash / Bank (or a contra to Salary Payable if deducted from paycheck directly)
- **Credit**: Employee Loan Asset (reducing the outstanding loan balance)

## Reversal Strategy
If HR finalizes a payroll run in error, `payrollAccountingService.reversePayrollPosting()` calls `postingService.reverse()`. This voids the Accrual journal and posts a counter-journal, unwinding the expense and liability without physically deleting historical ledger rows.

## Audit & Security
- **Tenant Isolation**: The service enforces `companyId` routing on every method.
- **Traceability**: Journals are stamped with `PAYROLL_RUN` and the exact UUID of the Payroll Batch ID, ensuring perfect traceability from the General Ledger back to the HR module.
- **RBAC**: Implemented `PAYROLL_POST` and `PAYROLL_POST_REVERSE` permissions to keep HR duties segregated from core Accounting duties.
