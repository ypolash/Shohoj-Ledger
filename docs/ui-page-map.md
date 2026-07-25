# Application Page Map & Inventory

This document lists the exhaustive inventory of all pages within the ERP, defining their purpose and primary elements.

## 1. CRM Module

### Customers List Page (`/dashboard/crm/customers`)
- **Purpose:** View and manage all enterprise clients.
- **Primary Action:** `+ New Customer` (Opens drawer)
- **Secondary Action:** Export to CSV/Excel
- **Filters:** Group, Status, Credit Rating
- **Table:** Standard DataTable (ID, Name, Contact, Group, Balance)
- **Navigation Destination:** Clicking a row goes to Customer Detail page.

### Customer Detail Page (`/dashboard/crm/customers/[id]`)
- **Purpose:** 360-degree view of a single customer.
- **Primary Action:** `Edit Profile`
- **Secondary Action:** `Create Quotation`
- **KPIs:** Total Sales, Outstanding Balance, Available Credit
- **Tabs:** Overview, Contacts, Addresses, Opportunities, Orders, Financials.
- **Side Panels:** Credit History log.

### Leads List Page (`/dashboard/crm/leads`)
- **Purpose:** Manage prospective clients.
- **Primary Action:** `+ Add Lead`
- **Table:** DataTable with Kanban toggle.
- **Dialogs:** Lead Conversion Wizard (Lead -> Customer).

### Opportunities Board (`/dashboard/crm/opportunities`)
- **Purpose:** Visual sales pipeline.
- **Primary Action:** `+ New Opportunity`
- **Layout:** Kanban Board (Stages) or List view.
- **KPIs:** Expected Revenue, Win Rate.

### Quotations List (`/dashboard/crm/quotations`)
- **Purpose:** Track sent quotes.
- **Primary Action:** `+ Create Quote`
- **Filters:** Date Range, Status (Draft, Sent, Accepted).

---

## 2. Finance Module

### General Ledger (`/dashboard/finance/ledger`)
- **Purpose:** Complete transactional history.
- **Primary Action:** `Add Journal Entry`
- **Filters:** Date Range, Account Type, Debit/Credit toggle.
- **Table:** Dense DataTable (Date, Account, Ref, Debit, Credit, Balance).

### Income / Expense Pages
- **Purpose:** Register non-operational cash flows.
- **Primary Action:** `Record Income/Expense` (Opens Side Panel)
- **Charts:** Monthly burn rate / revenue chart above the table.

---

## 3. Inventory Module

### Products List (`/dashboard/inventory/products`)
- **Purpose:** Master product catalog.
- **Primary Action:** `+ Add Product`
- **Table:** Image thumbnail, SKU, Name, Category, Price, Stock.

### Stock Ledger (`/dashboard/inventory/stock-ledger`)
- **Purpose:** Immutable log of physical stock movements.
- **Primary Action:** `Manual Adjustment` (Requires admin).
- **Filters:** Warehouse, Product, Movement Type (IN/OUT).

---

## 4. HR & Payroll Module

### Employees List (`/dashboard/hr/employees`)
- **Purpose:** Personnel master data.
- **Primary Action:** `+ Onboard Employee`
- **Table:** Avatar, Name, Department, Designation, Status.

### Payroll Runs (`/dashboard/payroll/runs`)
- **Purpose:** Generate and approve monthly salaries.
- **Primary Action:** `+ New Payroll Run` (Wizard).
- **Table:** Period, Total Gross, Total Net, Status (Draft, Approved, Paid).
- **Secondary Action:** Download Bank Transfer CSV.

---

## 5. Generic Standards for All Pages

- **Breadcrumbs:** Required on all detail pages (e.g., `CRM / Customers / Acme Corp`).
- **Toolbar:** Placed directly below the page header. Contains Search, Filters, and Primary Actions.
- **Side Panels:** Preferred over full-page navigation for Create/Edit forms to preserve user context.
