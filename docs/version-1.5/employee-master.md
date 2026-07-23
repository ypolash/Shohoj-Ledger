# Version 1.5 - Enterprise Employee Master

## 1. Architecture
The Enterprise Employee Master transforms the original lightweight `Employee` module into a fully comprehensive HR record. Rather than replacing the legacy model (which would break Accounting, Procurement, and Inventory integrations), we extended it by adding one-to-one and one-to-many relational tables.
- **Core Model:** `Employee` (Maintains basic legacy fields).
- **Extended Models:** `EmployeeProfile`, `EmployeeAddress`, `EmployeeEmergencyContact`, `EmployeeEducation`, `EmployeeExperience`, `EmployeeDocument`, `EmployeeReporting`.

## 2. Employee Lifecycle
The employee lifecycle is tracked immutably via the `EmployeeLifecycle` model. 
Every major transaction—Hire, Confirmation, Promotion, Transfer, Salary Revision, Suspension, Resignation, Termination, Retirement—inserts a chronological record detailing the previous and new data. This ensures absolute HR auditability without overwriting past state inappropriately.

## 3. Organization Integration
The `Employee` is now firmly nested within the Phase 1 Organization Structure:
- Connected to `Branch`, `Division`, `Department`, `Section`, `Team`.
- Role details are managed via `JobPosition`, `Designation`, `EmployeeGrade`, and `EmploymentType`.
- Financial and time constraints mapped via `CostCenter` and `WorkShift`.

## 4. Security & RBAC
- **Strict Isolation:** All queries must explicitly pass `{ where: { companyId } }`.
- **Role Permissions:** Added `EMPLOYEE_VIEW`, `EMPLOYEE_CREATE`, `EMPLOYEE_UPDATE`, `EMPLOYEE_DELETE`, `EMPLOYEE_TRANSFER`, `EMPLOYEE_PROMOTE`, `EMPLOYEE_CONFIRM`.
- **Self vs Manager Access:** Employees can view their own profile and upload documents. Managers can access profiles of employees mapped via `EmployeeReporting`.

## 5. Audit
- All lifecycle events, document uploads, and profile modifications trigger audit logging. 
- Transfers and Promotions explicitly snapshot `previousData` and `newData` inside `EmployeeLifecycle`.

## 6. Future Payroll Integration
The new architecture paves the way for the Payroll Engine. `EmployeeGrade` establishes the salary bands, while `CostCenter` will dictate how payroll expenses are divided when posted to the General Ledger. `WorkShift` will integrate directly with Time & Attendance to calculate accurate hourly or daily wages.
