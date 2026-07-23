# Warehouse Service Layer (Phase 2A)

## 1. Overview
The Phase 2A foundation introduces four distinct service controllers to manage the Enterprise Storage Hierarchy. 

## 2. Core Services

### `warehouseService.ts`
Manages the Level 1 physical locations.
- `createWarehouse` & `updateWarehouse`: Handles site metadata and dynamically unsets the previous `isDefault` warehouse if a new one is flagged as default.
- `disableWarehouse`: Soft-deletes a warehouse (changing `isActive` to false) to preserve historical `ProductWarehouse` records.

### `zoneService.ts` & `binService.ts`
Manage the Level 2 and Level 3 hierarchies. These are designed to be optional. A small business can use just Warehouses, while an enterprise can heavily utilize Zones and Bins.

### `productWarehouseService.ts`
The operational core of the inventory engine.
- `reserveStock()`: Secures inventory for a pending order. It strictly validates that `Quantity - ReservedQuantity >= RequestedQuantity`, preventing overselling.
- `releaseStock()`: Frees up reserved inventory if a customer cancels an order before dispatch.
- `moveStock()`: Executes an atomic `$transaction` to decrement stock from a source warehouse and increment/create stock in a destination warehouse.
- `adjustStock()`: Safely handles positive/negative manual counts from physical audits.

## 3. Security & Access
- All write operations require explicit injection of `companyId` from the authenticated context.
- Executing these services will be shielded by the new RBAC permissions: `WAREHOUSE_VIEW`, `WAREHOUSE_MANAGE`, `WAREHOUSE_TRANSFER`, `WAREHOUSE_ADJUST`, and `BIN_MANAGE`.
