# Warehouse Operations Engine (Phase 2B)

## 1. Overview
The Phase 2B Operations Engine acts as the strict gateway for all physical inventory manipulation. By centralizing stock movements through `warehouseOperationService.ts`, the ERP guarantees that no direct `prisma.productWarehouse.update()` calls can bypass access controls, negative-stock constraints, or warehouse active/inactive statuses.

## 2. Operation Lifecycle
All stock manipulations follow a standardized execution sequence:
1. **Authorization Context**: Check `companyId` and future `branchId` claims via RBAC (`WAREHOUSE_RECEIVE`, `WAREHOUSE_ISSUE`, etc.).
2. **Entity Validation (`validateWarehouseOperation`)**: Ensure the Warehouse, Zone, and Bin actually exist, belong to the tenant, and are marked `isActive: true`.
3. **Availability Validation (`validateStockAvailability`)**: If stock is being decremented (e.g., Issue, Transfer, Negative Adjust), calculate `Available = Physical - Reserved`. Ensure the request does not exceed `Available`.
4. **Execution**: Perform the mathematical increment/decrement. Intra-company transfers run inside an atomic `$transaction` to ensure neither the source nor destination ledger corrupts.

## 3. Reservation Architecture
The engine separates Physical Stock from Available Stock to support asynchronous e-commerce and B2B ordering.
- `reserveStock()`: Called when a Sales Order is confirmed. Secures the stock immediately so it cannot be double-sold.
- `issueStock()`: Called when the warehouse clerk physically packs and ships the reserved order. It deducts the reserved amount and the physical amount simultaneously (future integration hook).
- `releaseReservation()`: Called if a Sales Order is cancelled before packing, safely unlocking the inventory.

## 4. Transfer Flow
`transferStock()` safely migrates stock between two physical sites belonging to the same tenant. It guarantees:
- Both warehouses exist and are active.
- The user has permissions in the source warehouse.
- The transaction commits both the decrement and increment atomically.

## 5. Audit Strategy
While Phase 2B establishes the mechanical movement layer, the future `StockTransaction` event log (from V1.2) will be re-wired in Phase 2C to automatically ingest the `userId`, `referenceType`, and `referenceId` passed into these methods, creating a perfect compliance trail for shrink, loss, and movement.

## 6. Security Model
The system enforces complete tenant isolation by natively scoping all `findFirst` operations and constraints to the authenticated `companyId`. An operation referencing a valid `warehouseId` but an incorrect `companyId` will fail with an authorization exception.
