# Enterprise Sidebar Navigation Structure

This document defines the complete sidebar hierarchy for Shohoj Ledger Enterprise ERP.

## Global Navigation Features
- **Collapsible Drawer:** Can be pinned open (280px) or collapsed to icon-only (80px).
- **Recent Pages:** The top of the sidebar displays the 3 most recently accessed pages.
- **Favorites:** Users can star any page to pin it to a "Favorites" section above the main modules.
- **Search:** A quick filter input at the top of the sidebar filters the menu items.

## Menu Hierarchy

### 1. Dashboard (Icon: `home`)
- **Main Dashboard** (Default)
- **Analytics Center** (Requires: `VIEW_ANALYTICS`)

### 2. CRM (Icon: `users`)
- **Customers** (Requires: `VIEW_CUSTOMERS`)
- **Leads** (Requires: `VIEW_LEADS`)
- **Opportunities** (Requires: `VIEW_OPPORTUNITIES`)
- **Quotations** (Requires: `VIEW_QUOTATIONS`)
- **Sales Orders** (Requires: `VIEW_SALES_ORDERS`)
- **Delivery Orders** (Requires: `VIEW_DELIVERY_ORDERS`)
- **Invoices** (Requires: `VIEW_INVOICES`)
- **Payments** (Requires: `VIEW_PAYMENTS`)

### 3. Finance (Icon: `dollar-sign`)
- **Income**
- **Expenses**
- **General Ledger** (Requires: `VIEW_LEDGER`)
- **Funds & Accounts**
- **Reserves**
- **Settlements**

### 4. Inventory (Icon: `box`)
- **Products** (Requires: `VIEW_PRODUCTS`)
- **Warehouses** (Requires: `MANAGE_STOCK`)
- **Stock Ledger** (Requires: `VIEW_STOCK`)
- **Categories & Units**

### 5. HR (Icon: `briefcase`)
- **Employees** (Requires: `VIEW_EMPLOYEES`)
- **Attendance** (Requires: `VIEW_ATTENDANCE`)
- **Leave Requests** (Requires: `VIEW_LEAVE`)
- **Loans** (Requires: `VIEW_LOANS`)
- **Advances**

### 6. Payroll (Icon: `credit-card`)
- **Salary Structures** (Requires: `MANAGE_PAYROLL`)
- **Payroll Runs**
- **Payslips**

### 7. Projects (Icon: `folder`)
- **Active Projects**
- **Tasks**
- **Timesheets**

### 8. Reports (Icon: `bar-chart-2`)
- **Financial Reports**
- **Sales Reports**
- **HR Reports**
- **Audit Logs**

### 9. Settings (Icon: `settings`)
- **Company Profile** (Requires: `MANAGE_COMPANY`)
- **Tax Rates**
- **Currencies**
- **Payment Terms**

### 10. Administration (Icon: `shield`)
- **Users & Roles** (Requires: `MANAGE_USERS`)
- **System Settings**
- **Integrations**

## Badges
- Modules with pending actions (e.g., Leave Requests waiting for approval) display a dynamic red badge counter next to the label.
