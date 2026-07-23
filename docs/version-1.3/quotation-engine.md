# Enterprise Quotation Engine (Version 1.3 Phase 3D)

## Overview
The Enterprise Quotation Engine serves as the core commercial offer system. It allows sales representatives to structure precise product offerings with complex pricing, tax, and discount rules tied back directly to an Opportunity and Customer profile.

## Architecture
- **Additive Extension:** Extends the Phase 3C `Opportunity` module. Can be launched directly from a `Customer` or via an `Opportunity`.
- **Database Models:**
  - `Quotation`: The header holding global information, pricing summaries, validity dates, status, and audit linkages.
  - `QuotationLine`: Detailed breakdown of products, quantities, exact unit pricing, line-item discounts, line-item taxes, and an optional linkage to the fulfilling `Warehouse`.
- **Service Layer:** `lib/crm/quotationService.ts` provides comprehensive programmatic access for creating, editing, and transitioning Quotes without accessing Prisma directly from the UI.

## Quotation Lifecycle & Approval Flow
1. **Creation (DRAFT):** Created manually or by converting an `Opportunity`.
2. **Review (PENDING_APPROVAL):** Transferred to a manager for pricing/discount checks.
3. **Internal Approval (APPROVED):** `approveQuotation()` sets the internal flag, stamping the approver ID and timestamp.
4. **Distribution (SENT):** Marked as given to the Customer.
5. **Customer Decision (ACCEPTED / REJECTED):** The Customer's response.
6. **Expiration (EXPIRED):** If the `expiryDate` passes without acceptance.
7. **Execution (CONVERTED):** An `ACCEPTED` quote is passed to `convertToSalesOrder()`, finalizing its active state within the CRM before pushing it to operations (Phase 3E).

## Pricing Model
- **Line-level Pricing:** Subtotaling is calculated iteratively through the lines. Formula: `Gross = Quantity * Unit Price`. 
- **Line-level Discounts/Taxes:** Each line can independently have a percentage discount yielding a specific `discountAmount`, and a percentage tax yielding a `taxAmount`.
- **Header-level Modifiers:** Once lines are aggregated, an overarching `shippingAmount` can be added and a flat global `discountAmount` subtracted to yield the final `totalAmount`.

## Validations
- Expiry date cannot be instantiated in the past.
- `calculateTotals()` forcefully ensures DB entries match the math.
- Requires at least one `QuotationLine` to exist.
- Validates the existence of `Company`, `Customer`, `Opportunity`, `Product`, and `Warehouse`.

## Audit & Security
- **Global Audit Log:** Tracks all state changes. Pricing manipulations inherently fire `UPDATE` triggers through the `logAudit` pipeline capturing `beforeValue` and `afterValue`.
- **Multi-tenant Isolation:** Every interaction requires `companyId`.
- **RBAC Roles (Future Implementation):**
  - `QUOTATION_VIEW`, `QUOTATION_CREATE`, `QUOTATION_UPDATE`
  - `QUOTATION_APPROVE`, `QUOTATION_SEND`, `QUOTATION_ACCEPT`, `QUOTATION_CONVERT`

## Future Integration (Phase 3E)
- **Sales Orders:** `convertToSalesOrder()` currently just flips the status to `CONVERTED`. Phase 3E will map the `Quotation` and `QuotationLine` models directly into `SalesOrder` and `SalesOrderLine` models.
- **Inventory/Accounting Boundaries:** A `Quotation` is strictly a CRM document. It **does not** reserve inventory, nor does it post expected revenues to the Accounting ledgers.
