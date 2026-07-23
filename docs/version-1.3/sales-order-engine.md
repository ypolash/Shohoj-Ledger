# Enterprise Sales Order Engine (Version 1.3 Phase 3E)

## Overview
The Enterprise Sales Order Engine serves as the core operational bridge between CRM (Sales) and Supply Chain (Inventory). A Sales Order acts as a confirmed commitment by the customer to purchase goods. 

Crucially, in this architecture, a Sales Order **does not** physically deduct stock or hit accounting ledgers. Its primary job is to mathematically lock (reserve) inventory to prevent double-selling before warehouse fulfillment begins.

## Architecture
- **Additive Extension:** Built upon Phase 3D (`Quotation Engine`) and links into the Enterprise Inventory 2.0 system.
- **Database Models:**
  - `SalesOrder`: Master header model tracking the overall financial commitment, linked to `Customer` and optionally `Quotation`.
  - `SalesOrderLine`: Detailed breakdown of products. Enforces a mandatory link to a `Warehouse` to understand exactly *where* stock is expected to be drawn from. Contains a `reservedQuantity` field separate from `quantity`.
- **Service Layer:** `lib/crm/salesOrderService.ts` implements strict state management, pricing validation, and soft-reservation logic.

## Order Lifecycle & Reservation Flow
1. **Creation (DRAFT):** Created manually or via `convertQuotation()`.
2. **Review (PENDING_APPROVAL):** Awaiting managerial sign-off.
3. **Approval (APPROVED):** The order is locked for pricing.
4. **Reservation (OPEN):** Calling `reserveInventory()` iterates over the `SalesOrderLine` items and sets `reservedQuantity = quantity`. 
   - *Note:* It purposefully **omits** generating `StockMovement` or `InventoryTransaction` records as those dictate physical loss of stock.
5. **Fulfillment (PARTIALLY_DELIVERED / DELIVERED):** Handled downstream by Phase 3F (Delivery Orders).
6. **Cancellation (CANCELLED):** Aborting an order automatically triggers `releaseReservation()` to free up the locked stock numbers.
7. **Resolution (CLOSED):** Final state once delivery and invoicing are completed.

## Pricing Model
Inherits the identical mathematical engine as the `Quotation Engine`.
- Line-level math: `Gross = Quantity * UnitPrice`.
- Line-level modifiers: `discountPercent` and `taxPercent`.
- Header-level modifiers: `shippingAmount` and `discountAmount`.

## Validations
- `calculateTotals()` forcefully ensures DB pricing logic integrity.
- Validation strictly enforces that a `warehouseId` exists on every single line item to ensure reservations have a valid physical target.
- Validates the existence of `Company`, `Customer`, `Quotation`, `Product`, and `Warehouse`.

## Audit & Security
- **Global Audit Log:** Tracks all state changes natively through `logAudit`. Capturing before/after states on price alterations. Tracks the moment reservations are clamped or released.
- **Multi-tenant Isolation:** Every interaction requires `companyId`.
- **RBAC Roles (Future UI Implementation):**
  - `SALESORDER_VIEW`, `SALESORDER_CREATE`, `SALESORDER_UPDATE`
  - `SALESORDER_APPROVE`, `SALESORDER_RESERVE`, `SALESORDER_CANCEL`, `SALESORDER_CLOSE`

## Future Integration (Phase 3F)
- **Delivery Orders:** Phase 3F will read the `OPEN` Sales Order and its `reservedQuantity` to generate pick lists and Delivery Orders. Only when a Delivery Order ships will physical stock be deducted via `StockMovement` records.
- **Accounting:** Invoices generated off the Delivery Order/Sales Order will post the actual Revenue and COGS ledgers.
