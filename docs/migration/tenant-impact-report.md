# Tenant Impact Report

## Existing Prisma Models
User, Session, Account, Verification, Project, Income, Expense, FundTransaction, ReserveTransaction, MemberLoan, Advance, Settlement, IncomeCategory, Member, Employee, Task, Attendance, LeaveRequest, SalaryPayment, SalaryDeduction, Bonus, Payslip, Lead, AllowedNetwork, PunishmentSetting, AttendanceConfig

## Models Using companyId
User, Project, Income, Expense, FundTransaction, ReserveTransaction, MemberLoan, Advance, Settlement, IncomeCategory, Member, Employee, Task, Attendance, LeaveRequest, SalaryPayment, SalaryDeduction, Bonus, Payslip, Lead, AllowedNetwork, PunishmentSetting, AttendanceConfig

## APIs Affected
- `/api/auth/*`
- `/api/employees/*`
- `/api/attendance/*`
- `/api/payroll/*`
- `/api/expenses/*`
- `/api/leads/*`
- `/api/tasks/*`
- `/api/settlements/*`
- `/api/reserves/*`
- `/api/advances/*`

## Android APIs Affected
- `/api/mobile/attendance/*`
- `/api/mobile/employees/*`
- `/api/mobile/tasks/*`
- All other mobile entry points reading business models.

## Services Affected
- Authentication/Session Service
- Payroll Calculation Service
- Attendance Service
- CRM (Lead) Service
- Financial Aggregation (Settlements, Funds, Income, Expense)

## Repositories Affected
- All Prisma query blocks (`prisma.employee.findMany`, etc.) must now include a `where: { companyId }` clause.
