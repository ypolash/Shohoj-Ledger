# Enterprise Customer Returns (RMA) (Version 1.3 Phase 3G)

## Overview
The Enterprise Customer Return (RMA) module allows the organization to handle reverse logistics seamlessly. When physical goods are delivered via Phase 3F (`Enterprise Delivery Order Workflow`), they can be returned due to damage, defects, or customer dissatisfaction.

Crucially, this phase manages the physical inventory reconciliation. It **does NOT** issue accounting Credit Notes or AR adjustments. Financial adjustments are explicitly deferred to Phase 3H (Invoicing).

## Architecture
- **Additive Extension:** Built upon Phase 3F (`Delivery Order Workflow`) and integrates heavily with Enterprise Inventory 2.0.
- **Database Models:**
  - `CustomerReturn`: Header linking the RMA to the original `DeliveryOrder` and `Customer`. Manages overall inspection state.
  - `CustomerReturnLine`: Maps exactly to a `DeliveryOrderLine`. It enforces `returnCondition` (e.g., `GOOD`, `DEFECTIVE`, `SCRAP`) which drives backend branching logic.
- **Service Layer:** `lib/crm/customerReturnService.ts` manages the intake, inspection, restocking, or scrapping of returned goods.

## Return Workflow
1. **Intake (DRAFT):** Created by linking to a previously shipped `DeliveryOrder`.
2. **Review (PENDING_APPROVAL / APPROVED):** Initial authorization to accept the physical package back.
3. **Inspection (INSPECTING):** The `inspectReturn()` method flags the goods as physically received but under evaluation.
4. **Resolution Branching:**
   - **GOOD (`restockInventory()`):** If the items are in sellable condition, an inbound `StockMovement` is created. Physical stock is incremented, and an `InventoryValuationLayer` (FIFO) is mathematically restored to track cost.
   - **BAD (`scrapInventory()`):** If items are `DAMAGED`, `DEFECTIVE`, or `SCRAP`, they are conceptually received and immediately written off via a simulated Inventory Adjustment. Sellable stock is not increased, and FIFO is not restored.
5. **Completion (COMPLETED):** RMA is finalized, making it eligible for Phase 3H Credit Note generation.

## Validations
- A return line cannot exceed the `quantity` shipped on its parent `DeliveryOrderLine`.
- Returns strictly enforce that the `batchId` and `serialId` of the returned item exactly match what was shipped.
- You cannot restock items marked with bad return conditions without manual adjustments.

## Audit & Security
- **Global Audit Log:** Tracks intake, inspection notes, restocking transactions, and scrapping events via `logAudit`.
- **Multi-tenant Isolation:** Every payload strictly enforces `companyId` boundaries.
- **RBAC Roles (Future UI Implementation):**
  - `CUSTOMERRETURN_VIEW`, `CUSTOMERRETURN_CREATE`, `CUSTOMERRETURN_APPROVE`, `CUSTOMERRETURN_INSPECT`, `CUSTOMERRETURN_RESTOCK`, `CUSTOMERRETURN_SCRAP`

## Future Integration (Phase 3H)
- **Customer Credit Management:** The finalized `CustomerReturn` (regardless of whether it was restocked or scrapped) serves as the legal basis to issue a Credit Note in Phase 3H. This Credit Note will post the AR reduction and Revenue reversal journal entries in the Accounting Engine.
