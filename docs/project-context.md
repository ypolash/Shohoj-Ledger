<!-- markdownlint-disable MD024 -->
# PROJECT CONTEXT

## Project Name

Shohoj Ledger

---

## Overview

Shohoj Ledger is a modern SaaS Multi-Tenant ERP/CRM platform.

The platform manages

- Finance
- HR
- Attendance
- Payroll
- CRM
- Leads
- Projects
- Revenue Sharing
- Company Operations

The platform is designed to support unlimited companies from a single codebase while keeping every company's data completely isolated.

---

## Current Company

### Current Default Tenant

Shohoj Solution

Existing data belongs to this tenant.

Future companies will be created using Company Signup.

---

## Business Vision

Shohoj Ledger is NOT only a CRM.

It is a Modular ERP Platform.

Companies can enable or disable modules based on their business needs.

The long-term goal is to become a complete SaaS ERP ecosystem.

---

## Business Types

### Supported

#### Product Business

Examples

- Retail Shop
- Wholesale
- E-Commerce
- Manufacturing

##### Default Modules

- Inventory
- Purchase
- Sales
- Accounting
- CRM

---

#### Service Business

Examples

- Software Company
- Marketing Agency
- Consultancy
- Design Agency

##### Default Modules

- Projects
- Attendance
- Payroll
- CRM
- Accounting
- Lead Management

---

#### Product + Service

Supports both module groups.

---

## Industry Templates

### Initially Supported

IT Company

Automatically create

#### Departments

- Development
- Design
- QA
- HR
- Finance
- Sales
- Marketing
- Support

#### Job Titles

- Software Engineer
- Backend Developer
- Frontend Developer
- Android Developer
- Flutter Developer
- UI/UX Designer
- QA Engineer
- DevOps Engineer
- HR Executive
- Accountant
- Project Manager
- Marketing Executive
- Customer Support

Everything remains editable.

---

## Company Signup Flow

```text
Company Information
        ↓
Business Type
        ↓
Modules
        ↓
Industry Template
        ↓
Tenant Created
        ↓
Company Owner Created
        ↓
Company Setup Wizard
        ↓
Dashboard
```

---

## Revenue Sharing

### Current Default Tenant

Shohoj Solution

#### Settlement Distribution

- CEO — 40%
- Developers — 20%
- Advisor — 20%
- Company Reserve — 20%

#### Settlement Includes

- Paid Income
- Partial Income

#### Excluded

- Pending Income
- Cancelled Income

---

## Working Schedule

### Default

#### Working Days

- Saturday
- Sunday
- Monday
- Tuesday
- Wednesday
- Thursday

#### Weekly Holiday

- Friday

#### Working Hours

09:00 AM – 08:00 PM

#### Grace Period

Configurable

### Future

Each company can customize

- Working Days
- Shifts
- Weekend
- Attendance Rules

---

## Attendance

### Supports

- Check In
- Check Out
- Late
- Early Leave
- Overtime
- Absent
- Half Day
- Holiday
- Weekend

### Future

- Multiple Shifts
- Night Shift
- Rotating Shift
- GPS
- WiFi
- QR
- Face Recognition

---

## Payroll

### Supports

- Basic Salary
- Bonus
- Allowance
- Deduction
- Punishment
- Overtime
- Settlement

### Future

- Tax
- Provident Fund
- Festival Bonus
- Loan Adjustment
- Advance Adjustment

---

## Finance

### Modules

- Income
- Expense
- Fund
- Reserve
- Loan
- Advance
- Settlement

### Future

- Budget
- Asset Management
- Depreciation
- Cash Flow
- Bank Accounts

---

## CRM

### Supports

- Lead
- Customer
- Task
- Projects
- Staff

### Future

- Pipeline
- Quotation
- Invoice
- Customer Portal
- Vendor Portal

---

## Android Application

### Platform

Native Android

### Technology

- Retrofit
- JWT Authentication

Uses the same APIs as the Web Application.

Backward compatibility is mandatory.

---

## Multi-Tenant Rules

Every company has its own:

- Database Records
- Employees
- Attendance
- Payroll
- Finance
- CRM
- Reports
- Settings

No company can access another company's data.

`tenantId` controls every business record.

---

## Roles

### Platform

- Super Admin

### Company

- Owner
- Admin
- HR
- Manager
- Accountant
- Project Manager
- Team Leader
- Employee

Permissions are RBAC based.

---

## Module System

Every company can enable:

- Accounting
- Attendance
- Payroll
- CRM
- Projects
- Inventory
- Purchase
- Sales
- HR
- Lead Management

Future modules can be installed without changing existing architecture.

---

## Long-Term Roadmap

- Subscription
- Billing
- Module Marketplace
- POS
- Inventory
- Warehouse
- Asset Management
- Vendor Portal
- Customer Portal
- AI Assistant
- Analytics
- Automation
- Public API
- Workflow Builder
- Document Management
- Mobile App V2
- iOS Application
- Desktop Application

---

## Development Philosophy

- Never redesign working modules.
- Never rewrite stable business logic.
- Always extend.
- Maintain backward compatibility.
- Protect production stability.
- Database migrations must always be safe.
- Every new feature must support Multi-Tenant architecture.
- Every decision should prioritize long-term scalability.

Shohoj Ledger is being built as an Enterprise SaaS ERP platform.
