# Posting Rules & Templates (Phase 1H-A)

## 1. Overview
This document defines the strict, unalterable double-entry templates for every major business event in the Shohoj Ledger ERP. The Posting Engine will mathematically enforce these templates to ensure GAAP compliance.

## 2. Templates by Module

### A. Sales Invoice (Credit Sales)
When a Sales Invoice is approved:
- **Debit**: Accounts Receivable (Total Invoice Amount)
- **Credit**: Sales Revenue (Subtotal)
- **Credit**: Sales Tax Payable (Tax Amount)

### B. Purchase Invoice (Credit Purchases)
When a Purchase Bill is approved:
- **Debit**: Inventory Asset / Expense Account (Subtotal)
- **Debit**: Input Tax Receivable (Tax Amount)
- **Credit**: Accounts Payable (Total Bill Amount)

### C. Cash Receipt (Customer Payment)
When a customer pays an outstanding invoice:
- **Debit**: Cash / Bank Account (Payment Amount)
- **Credit**: Accounts Receivable (Payment Amount)
- *Note: If a discount is applied during payment, Debit "Sales Discounts" for the difference.*

### D. Cash Disbursement (Supplier Payment)
When paying a supplier bill:
- **Debit**: Accounts Payable (Payment Amount)
- **Credit**: Cash / Bank Account (Payment Amount)

### E. Expense Voucher
When an employee submits an operational expense (e.g., travel, meals):
- **Debit**: Specific Expense Account (e.g., Travel Expense)
- **Credit**: Cash / Bank / Petty Cash (if paid immediately)
- **Credit**: Accounts Payable / Employee Payable (if accrued)

### F. Payroll (Salary Payment)
When a monthly payroll run is executed:
- **Debit**: Salary & Wages Expense (Gross Salary)
- **Debit**: Employer Tax Expense (Employer Contributions)
- **Credit**: Tax Liabilities / Withholdings (Employee + Employer Deductions)
- **Credit**: Cash / Bank Account (Net Salary Paid)

### G. Inventory Adjustment (Shrinkage/Damage)
When inventory is lost or damaged:
- **Debit**: Inventory Shrinkage Expense (Cost Value of lost goods)
- **Credit**: Inventory Asset (Cost Value of lost goods)

### H. Bank Transfer (Contra Entry)
When moving money between internal accounts:
- **Debit**: Receiving Bank Account
- **Credit**: Sending Bank Account

### I. Manual Journal Voucher
For depreciation, accruals, and year-end adjustments:
- **Debit**: Custom Account selected by Accountant
- **Credit**: Custom Account selected by Accountant
- *Enforcement: Debits must exactly equal Credits before approval.*
