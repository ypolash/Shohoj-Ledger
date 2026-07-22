# Employee Management Module

## Overview
The Employee Management UI (`app/dashboard/staff-management/employees/page.tsx`) handles the HR representation of staff. It focuses on organizational details, employment status, and base salaries.

## Features
- **Employee Listing & Metrics:** Shows real-time KPIs (Total Employees, Active, Inactive, Departments, Monthly Salary footprint).
- **Search & Filters:** Granular filtering by Department, Designation, and Status.
- **Add Employee:** Provisions a new `prisma.employee`. If an app password is provided, it automatically links to a `prisma.user` record for portal access.
- **Edit Employee:** Modifies details (designation, department, salary) and updates the linked `User` record's name simultaneously.
- **Terminate Employee:** Safely flags an employee as `TERMINATED` rather than deleting the row to maintain historical payroll and ledger integrity. Also disables the linked `User` account.

## Backend Integration
All actions route through `app/dashboard/staff-management/employees/actions.ts`:
- `fetchEmployees()`: Loads all employees under the company.
- `createEmployee(data)`: Enforces unique `email` and `employeeId` constraints. Provisions a `User` account automatically if credentials are provided.
- `updateEmployee(id, data)`: Synchronizes the updated employee name with their `User` account.
- `deleteEmployee(id)`: Sets status to `TERMINATED` and the linked User role to `inactive`.

## Security & Integrity
- **Isolation:** `companyId` guarantees strict multi-tenant isolation.
- **Validation:** Server actions validate duplication constraints prior to Prisma inserts to yield user-friendly error messages.
- **Audit Compliance:** Soft deletion ensures that past salary transactions and tasks assigned to the employee are not orphaned.
