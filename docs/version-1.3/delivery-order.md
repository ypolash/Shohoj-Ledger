# Enterprise Delivery Order Workflow (Version 1.3 Phase 3F)

## Overview
The Enterprise Delivery Order Workflow represents the critical junction where mathematical commitments (Sales Orders) become physical reality. It is the definitive document authorizing the removal of inventory from the warehouse and transferring custody to a carrier or customer.

Crucially, this is the **first and only** operational document in the outbound pipeline that reduces physical stock, generates Stock Movements, and consumes FIFO valuation layers.

## Architecture
- **Additive Extension:** Built upon Phase 3E (`Sales Order Engine`) and deeply integrates with Enterprise Inventory 2.0 (Phase 2).
- **Database Models:**
  - `DeliveryOrder`: Master header tracking logistics (Carrier, Tracking Number) and bridging `SalesOrder` to shipment.
  - `DeliveryOrderLine`: Granular fulfillment map. Links directly to `SalesOrderLine`, specifying the exact `Warehouse`, `Zone`, `Bin`, `InventoryBatch`, and `InventorySerial` used to fulfill the order.
- **Service Layer:** `lib/crm/deliveryOrderService.ts` implements the complex orchestration of releasing reservations, deducting stock, and consuming FIFO layers transactionally.

## Workflow Execution
1. **Creation (DRAFT):** Created manually via `createDeliveryOrder()` or systematically via `convertSalesOrder()`.
2. **Review (PENDING_APPROVAL):** Awaiting logistics manager sign-off.
3. **Approval (APPROVED):** The order is cleared for physical picking and packing.
4. **Logistics (PICKING / PACKING):** Utilizes `PickingTask` and `PackingTask` systems (from V1.2/V1.3) to gather physical goods.
5. **Fulfillment (SHIPPED):** Calling `shipDelivery()` executes the core monolithic transaction:
   - **Releases Reservation:** Reduces the `reservedQuantity` on the originating `SalesOrderLine`.
   - **Reduces Inventory:** Decrements `quantity` on `ProductWarehouse`, `InventoryBatch`, and updates `InventorySerial` status to `SOLD`.
   - **Creates Stock Movements:** Generates `OUT` transactions for accurate audit trails.
   - **Consumes FIFO:** Deducts `remainingQty` from `InventoryValuationLayer` to mathematically record the Cost of Goods Sold (COGS).
6. **Completion (DELIVERED):** Confirms customer receipt.
7. **Cancellation (CANCELLED):** Aborts the process. Prohibited if already shipped.

## Inventory & Accounting Integration
- **Strict Separation:** The Delivery Order handles the physical goods and COGS calculations. It **does NOT** create the Customer Invoice (Accounts Receivable or Revenue). That is strictly reserved for Phase 3H.
- **FIFO Consumption:** Automatically consumes oldest `InventoryValuationLayer` records first. This prepares the exact COGS figure needed for future accounting journals without actually posting the journal entries yet.

## Validations
- Validation strictly enforces that you cannot deliver more than what was `reservedQuantity` on the Sales Order.
- Validates the physical existence of `Batch` and `Serial` numbers in the specified warehouse before allowing shipment.

## Audit & Security
- **Global Audit Log:** Tracks all state changes natively through `logAudit`.
- **Transactional Safety:** `shipDelivery()` wraps reservation release, stock deduction, and FIFO consumption in a singular `$transaction` to prevent fragmented data on failure.
- **Multi-tenant Isolation:** Every interaction requires `companyId`.
- **RBAC Roles (Future UI Implementation):**
  - `DELIVERY_VIEW`, `DELIVERY_CREATE`, `DELIVERY_APPROVE`, `DELIVERY_SHIP`, `DELIVERY_CANCEL`

## Future Integration (Phase 3G & 3H)
- **Phase 3G (Customer Returns):** RMAs will reference `DeliveryOrder` and `InventorySerial` to return items into inventory.
- **Phase 3H (Invoice Engine):** Invoices will use the consumed FIFO values to post COGS and calculate Revenue/AR journals.
