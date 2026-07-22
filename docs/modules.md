<!-- markdownlint-disable MD024 -->
# Modules

## Income

### Purpose

Manage company income records.

### Features

- Create Income
- Update Income
- Delete Income
- Categories
- Partial Payment
- Full Payment
- Pending Payment

### Business Rules

Only Paid and Partial Paid income participate in Settlement.

Pending income never affects settlement.

Cancelled income is ignored.

Every income belongs to a tenant.

---

## Expenses

### Purpose

Manage company expenses.

### Features

- Categories
- Attachments
- Approval
- Recurring Expense

### Business Rules

Expenses reduce available balance.

Expenses never participate in revenue sharing.

Every expense belongs to one tenant.

---

## Projects

### Purpose

Manage client projects.

### Features

- Client
- Team
- Progress
- Budget
- Deadline
- Tasks

### Business Rules

Projects can generate income.

Projects belong to one tenant.

Project members must belong to the same tenant.

---

## Staff Management

### Purpose

Manage employees.

### Features

- Employee
- Department
- Designation
- Salary
- Status

### Business Rules

Employees belong to one tenant.

Employees cannot access other tenant data.

---

## Attendance

### Features

- Check In
- Check Out
- Late
- Early Leave
- Overtime

### Business Rules

Attendance uses company working schedule.

Future:

- GPS
- WiFi
- QR
- Face Recognition

---

## Payroll

### Features

- Salary
- Bonus
- Allowance
- Deduction
- Punishment
- Overtime

### Business Rules

Payroll is generated monthly.

Payroll depends on Attendance.

Loan deduction is optional.

Advance deduction is optional.

---

## Leave

### Features

- Apply Leave
- Approve
- Reject

### Business Rules

Leave affects attendance.

Approved leave is not marked absent.

---

## Lead Management

### Features

- Leads
- Pipeline
- Status
- Source

### Business Rules

Leads can convert into Customers.

---

## CRM

### Features

- Customer
- Projects
- Tasks

### Business Rules

Every customer belongs to one tenant.

---

## Finance

Modules

- Income
- Expense
- Fund
- Reserve
- Loan
- Advance
- Settlement

---

## Settlement

### Business Rules

Include

- Paid Income
- Partial Income

Exclude

- Pending Income
- Cancelled Income

Current Default Distribution

CEO 40%

Developers 20%

Advisor 20%

Company Reserve 20%

Future:
Each company can configure its own settlement rules.

---

## Module Dependencies

Attendance
    ↓

Payroll
    ↓

Finance
    ↓

Settlement

Projects
    ↓

Income

Lead
    ↓

Customer
    ↓

Projects
