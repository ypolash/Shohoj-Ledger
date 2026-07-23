# Version 1.5 - Enterprise HR & Payroll Architecture

## 1. Architecture Overview

The Enterprise HR & Payroll module (Version 1.5) provides a complete Hire-to-Retire workflow. It is designed as a highly modular extension to the Shohoj Ledger ERP. It strictly integrates with Version 1.3 (Accounting, Posting Engine, RBAC, Multi-Tenant, CRM, Inventory) and Version 1.4 (Procurement) without modifying any frozen modules.

The architecture emphasizes:
- **Decoupled Financials:** Financial impacts from Payroll, Loans, and Advances integrate securely and transactionally with the V1.3 `PostingService`.
- **Multi-Tenant Isolation:** Full `companyId` isolation across all records.
- **Workflow & Approval Engines:** Reusing the V1.3 `ApprovalFlow` for leaves, payroll finalization, and recruitment.

## 2. Hire-to-Retire Workflow

The system orchestrates the employee journey through the following linear flow:

**Organization Setup** ↓
**Recruitment** ↓
**Applicant** ↓
**Interview** ↓
**Job Offer** ↓
**Employee Onboarding** ↓
**Attendance Tracking** ↓
**Leave Management** ↓
**Payroll Processing** ↓
**Loan & Advance Management** ↓
**Performance Evaluation** ↓
**Training** ↓
**Promotion / Transfer** ↓
**Resignation / Termination** ↓
**Final Settlement**

## 3. Module Boundaries

### 3.1 Organization & Employee (Core HR)
- **Organization Structure:** Extends `Department` and `Designation`. Introduces `Grade`, `Employment Type`, `Shift`, and `Holiday Calendar`.
- **Employee Master:** Expands the existing `Employee` and `EmployeeLifecycle` models to track historical changes securely.
- **Document Management:** Securely stores employee IDs, contracts, background checks, and certifications.

### 3.2 Talent Acquisition (Recruitment)
- Job Requisitions, Applicant Tracking System (ATS), Interview Scheduling, and Offer generation.

### 3.3 Time & Attendance
- **Biometric & Geo Tracking:** GPS coordinates, WiFi BSSID validations.
- **Leave Management:** Extends `LeaveRequest` with dynamic accruals, balances, and multi-level approvals.

### 3.4 Financial HR (Payroll, Loans, Advances)
- **Payroll Engine:** Dynamic generation of `SalaryPayment`, `SalaryDeduction`, `Bonus`, and `Payslip`.
- **Loan & Advance Management:** Tracks disbursements and automates monthly EMI deductions from the payroll engine.

### 3.5 Talent Management
- **Performance Evaluation:** KRA/KPI tracking, continuous feedback, and annual appraisals.
- **Training:** Scheduling and tracking employee development programs.
- **HR Analytics:** KPI dashboards (Attrition, Headcount, Payroll Costs).

## 4. Accounting Integration Strategy

The HR & Payroll module **never duplicates accounting logic**. All financial events trigger the central `PostingService` (V1.3).

- **Payroll Processing:** Approving a `SalaryPayment` calls the posting engine to recognize Payroll Expense (Debit) and Payroll Payable (Credit) or Cash/Bank (Credit).
- **Advance Disbursement:** Recognized as Employee Advance (Debit) and Cash/Bank (Credit).
- **Loan Recovery:** EMI deductions during Payroll reduce the Loan Receivable balance transactionally.

## 5. Security & RBAC Strategy

- **Multi-Tenant Isolation:** Every query must enforce `{ where: { companyId } }`.
- **Role-Based Access:** Standardized roles: `HR_ADMIN`, `PAYROLL_ADMIN`, `MANAGER`, `EMPLOYEE`.
- **Employee Self-Service (ESS):** Employees can view their own payslips, request leave, and log attendance.
- **Manager Self-Service (MSS):** Managers can view their subordinates and approve leaves/timesheets based on `reportingManagerId`.
- **Audit Logs:** Utilize the existing `PayrollAudit`, `AuditEvent`, and `GlobalAuditLog` for trackability of salary adjustments and lifecycle events.

## 6. Attendance Reuse Strategy

- **Reuse:** Retain existing `Attendance`, `AttendanceConfig`, `AllowedNetwork`, and `PunishmentSetting` models.
- **Extend:** Add features for complex shift rosters, overtime (OT) multipliers, comp-off tracking, and automated absenteeism processing.
- **Freeze:** Do not break the existing check-in/out endpoints; instead, build V1.5 capabilities additively (e.g., using background jobs for late punishment evaluation).

## 7. Scalability & Background Processing

- **Asynchronous Payroll:** Payroll calculation for thousands of employees is offloaded to asynchronous background jobs (`JobStatus` / `BackgroundJob`).
- **Nightly Evaluation:** Attendance anomaly detection (late, absent, early leave) is evaluated nightly via cron.

## 8. Future Roadmap

- Native Biometric device integrations (ZKTeco, Virdi).
- AI-driven attrition risk forecasting and talent recommendations.
- Multi-currency payroll for global entities.
