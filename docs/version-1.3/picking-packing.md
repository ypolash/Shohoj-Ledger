# Enterprise Picking & Packing Engine (Phase 2I)

## 1. Architecture
The Phase 2I Engine manages the complete outbound fulfillment workflow. While `PutAway` manages stock flowing *onto* the shelves, `Picking` and `Packing` manage stock flowing *off* the shelves toward the customer.

This is a two-stage process:
1. **Picking**: An operator navigates the physical bins, removes the requested items, and places them into a staging cart or outbound holding area.
2. **Packing**: A packer verifies the picked items against the outbound order, secures them in packaging, and officially ships them out of the building.

## 2. Picking Workflow
The `pickingService.ts` handles the initial extraction:
- `createPickingTask()`: Initializes the task from a Sales Order and instantly verifies that sufficient physical stock actually exists in the requested `WarehouseBin`s.
- `pickItem()`: As the operator physically removes the item from the shelf, this triggers a `TRANSFER` via `stockMovementService.ts` moving the inventory from the storage `binId` to a hardcoded `STAGING-OUT` bin.

## 3. Packing Workflow
The `packingService.ts` handles the final departure:
- `createPacking()`: Converts a completed `PickingTask` into a pending `PackingTask`.
- `packItem()`: Verifies that the packer has securely packaged exactly what the picker retrieved.
- `completePacking()`: Executes the final outbound transaction. 
  1. Issues an `ISSUE` via `stockMovementService.ts`, permanently deducting the stock from the `STAGING-OUT` bin.
  2. Delegates to the **Phase 2M Valuation Engine** (`valuationService.consumeLayer()`) to deduct the financial layers using FIFO and calculate the precise COGS for the outbound shipment.

## 4. Pick Strategy & Scalability
- **FIFO/FEFO Enablement**: The `recommendPickSequence()` method is currently stubbed to sort by Bin Code (to minimize warehouse walking distance - the Traveling Salesman Problem). Future upgrades will sort lines by Batch Expiry (FEFO) or received date (FIFO) directly from the dashboard.
- **Transactional Safety**: The final `completePacking()` function executes the physical movement, the layer consumption, and the status updates within a unified `prisma.$transaction`. This prevents race conditions where stock could be financially drained but physically stuck.

## 5. Security & RBAC
- **Tenant Isolation**: `companyId` strictly isolates all tasks. You cannot pick stock for another tenant.
- **RBAC**: Integrated `PICKING_VIEW`, `PICKING_ASSIGN`, `PICKING_EXECUTE`, `PACKING_VIEW`, and `PACKING_EXECUTE` into `defaultPermissions.ts`.
