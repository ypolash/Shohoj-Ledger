# Module Dependency Map (Version 1.2)

This document outlines the dependencies introduced by Version 1.2 modules.

## 1. Workflow Automation Engine
**Depends on:**
- RBAC (Role-based actions)
- Users & Employees (Assigning actions)
- Notifications (Triggering alerts on step completion)
- Audit Logs (Recording workflow execution history)

## 2. Approval Engine
**Depends on:**
- Workflow Engine (Can be built as a specialized workflow)
- RBAC (Determining approvers)
- Notifications (Alerting approvers and requesters)
- Core Modules (Leave, Expenses, Purchase Orders - as targets of approvals)

## 3. Advanced Reporting
**Depends on:**
- RBAC (Report permissions)
- All Data Modules (Attendance, Payroll, Accounting, CRM, Inventory)

## 4. Notification Center 2.0
**Depends on:**
- Users & Employees (Recipients)
- API Platform (Webhooks delivery)

## 5. API Platform
**Depends on:**
- RBAC (API permissions reflecting role permissions)
- Company Administration (Tenant isolation for API keys)
- Audit Logs (Tracking API usage)

## 6. Multi Branch
**Depends on:**
- Company Administration (Branches belong to companies)
- Users & Employees (Branch assignment)
- RBAC (Branch-level permissions)
- Inventory (Warehouse to Branch mapping)

## 7. Advanced Inventory
**Depends on:**
- Multi Branch (Inter-branch transfers)
- Accounting (Valuation, automated expense/asset entry)
- Approval Engine (Purchase order approvals)

## 8. AI Intelligence
**Depends on:**
- Advanced Reporting (Data source)
- Core Modules (CRM, Accounting, Attendance)
