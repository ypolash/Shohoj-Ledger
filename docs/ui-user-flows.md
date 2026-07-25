# Enterprise User Flows

This document outlines the standard operational workflows from a UI perspective.

## 1. CRM: Lead to Cash Flow
This is the primary revenue pipeline workflow.

1. **Lead Generation:** User creates a Lead in the Drawer (`/dashboard/crm/leads`).
2. **Qualification:** User updates Lead status to `QUALIFIED`.
3. **Conversion:** User clicks "Convert". A Dialog prompts to create a `Customer` and optionally an `Opportunity`.
4. **Opportunity Management:** User drags the Opportunity card across the Kanban board (`/dashboard/crm/opportunities`).
5. **Quotation:** From the Opportunity Drawer, user clicks "Generate Quote". Routes to Quote Builder.
6. **Approval:** Quote moves from `DRAFT` to `APPROVED`.
7. **Sales Order:** Quote is accepted. System auto-generates a Sales Order (SO). User confirms SO, which reserves inventory.
8. **Delivery:** Warehouse user sees pending SO. Clicks "Fulfill". System generates Delivery Order and deducts stock.
9. **Invoicing:** Finance user clicks "Generate Invoice" from the DO or SO.
10. **Payment:** Customer pays. User registers Payment via the Drawer, allocating it to the Invoice.

## 2. HR: Employee Onboarding Flow
1. **Recruitment:** Applicant marked as `HIRED` in ATS.
2. **Onboarding Wizard:** Multi-step wizard opens:
   - Step 1: Personal Info
   - Step 2: Organizational assignment (Department, Role, Manager)
   - Step 3: Salary Structure & Bank Details
   - Step 4: Documents Upload
3. **Completion:** Employee record is created in `ACTIVE` state.

## 3. Payroll: Monthly Salary Run Flow
1. **Initiation:** HR clicks "New Payroll Run".
2. **Period Selection:** Dialog asks for Month/Year and target Departments.
3. **Draft Generation:** System calculates Attendance, Overtime, Loans, and Taxes.
4. **Review:** User views a large Data Grid. Exceptions (e.g., negative pay, missing attendance) are highlighted in red.
5. **Adjustment:** User can click a row to open a Drawer and add manual bonuses/deductions.
6. **Approval:** Click "Submit for Approval". Manager receives notification.
7. **Finalization:** Manager clicks "Approve & Lock". Accounting entries are dispatched silently in the background.

## 4. Inventory: Purchase & Restock Flow
1. **Requisition:** Employee requests laptop. Status `PENDING`.
2. **RFQ:** Procurement converts request to RFQ. Sends to 3 vendors.
3. **Comparison:** Vendors reply. User views Comparison Matrix UI.
4. **Purchase Order:** Winner is selected. PO is generated and sent.
5. **Goods Receipt (GRN):** Items arrive. User scans or enters quantities. Stock is physically added.
6. **Three-Way Match:** Supplier sends Invoice. System compares PO vs GRN vs Invoice. If variance < 2%, auto-approves.
7. **Payment:** Finance pays the Supplier Invoice.

## UI Implications for Flows
- **Progress Indication:** Wizards must show a stepper (e.g., Step 1 of 4).
- **Undo/Drafts:** Multi-step flows must auto-save as drafts.
- **Blocking Modals:** Irreversible actions (like locking payroll) require a strict confirmation dialog where the user types "CONFIRM".
