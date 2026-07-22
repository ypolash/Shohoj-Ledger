# Legacy Company Backfill Strategy

## Creation of Default Company
We will dynamically create the root company:
**Name:** Shohoj Solution
**BusinessType:** SERVICE (or BOTH)
**Status:** ACTIVE

## Mapping All Existing Data
Since current tables have `companyId` as a nullable field, existing records are "orphaned" in a multi-tenant context. 
A one-time Node/Prisma script will:
1. Create the "Shohoj Solution" company.
2. Retrieve the new `Company.id`.
3. Update all existing records where `companyId` is `null`.

## Entities to Map
- **Users:** Assign existing users to `Shohoj Solution` and default to `SUPER_ADMIN` or `MEMBER`.
- **Employees:** Update `Employee.companyId` = Shohoj Solution ID. Map `roleId` to a legacy "Admin" or "Staff" Role created under the company.
- **Finance Records:** Update `Income`, `Expense`, `FundTransaction`, `ReserveTransaction`, `Advance`, `MemberLoan`, `Settlement`.
- **Attendance & Payroll:** Update `Attendance`, `LeaveRequest`, `SalaryPayment`, `SalaryDeduction`, `Bonus`, `Payslip`, `AttendanceConfig`, `PunishmentSetting`.
- **CRM:** Update `Lead`.
- **Others:** Update `Task`, `Member`, `Project`, `IncomeCategory`, `AllowedNetwork`.

By making this backfill pass, all legacy queries will naturally fall under the single default tenant once the API is updated to enforce `companyId`.
