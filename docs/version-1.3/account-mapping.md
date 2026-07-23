# Account Mapping Strategy (Phase 1H-A)

## 1. Objective
Account Mapping dictates how operational business transactions dynamically route their debits and credits to the correct `ChartOfAccount` records. This abstracts the complexity of accounting from the operational users (e.g., HR managers, Sales clerks).

## 2. Global vs. Contextual Mapping
Account mapping exists on a hierarchy of specificity. The Posting Engine will resolve accounts using a fallback strategy:

1. **Entity-Specific Mapping**: E.g., A specific Customer has a custom "Accounts Receivable - VIP" account mapped.
2. **Category/Group Mapping**: E.g., The "Electronics" product category is mapped to "Revenue - Electronics".
3. **Global Default Mapping**: E.g., If no specific mapping exists, fall back to the company-wide default "Accounts Receivable".

## 3. Core Operational Modules

### Sales & Receivables
- **Accounts Receivable**: Mapped globally, or overridden per Customer Group.
- **Sales Revenue**: Mapped per Product Category or specific Product.
- **Sales Tax Payable**: Mapped to the specific Tax Rate entity applied to the invoice.
- **Sales Discounts**: Mapped globally to a contra-revenue account.

### Purchases & Payables
- **Accounts Payable**: Mapped globally, or overridden per Supplier.
- **Inventory Asset**: Mapped per Product Category.
- **Purchase Expenses**: For non-inventory purchases, mapped dynamically based on the Expense Category selected by the user.

### Payroll & HR
- **Salary Expense**: Mapped globally to a base payroll expense account, or overridden per Department.
- **Payroll Liabilities**: (Taxes, Provident Funds) Mapped to specific liability accounts defined in the Payroll Deduction configuration.
- **Cash/Bank**: The source account the salary is paid from.

### Inventory (Future)
- **Cost of Goods Sold (COGS)**: Mapped per Product Category.
- **Inventory Asset**: Mapped per Warehouse or Product Category.
- **Inventory Shrinkage/Loss**: Mapped to an expense account for stock adjustments.

## 4. UI/UX Strategy for Mapping
- Users should *never* be forced to select a GL Account during daily operations.
- Instead, Administrators configure the "Mapping Rules" once during onboarding.
- If a transaction occurs where a required mapping is missing, the transaction drops into a "Pending Review" queue, alerting the Controller to define the missing mapping before the post can execute.
