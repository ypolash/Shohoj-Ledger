# Warehouse Architecture (Phase 2A)

## 1. Enterprise Storage Hierarchy
To support enterprise logistics, the Phase 2 Inventory module introduces a strict 3-tier storage architecture:

1. **Warehouse (Level 1)**: The physical building or logical site (e.g., "New York Central Hub").
2. **Zone (Level 2)**: Large functional areas within the warehouse (e.g., "Cold Storage", "Receiving Dock", "Returns").
3. **Bin (Level 3)**: The exact physical shelf or rack space (e.g., "A-12-05").

Products can be stored at the broad Warehouse level, or tracked granularly down to the specific Bin via the `ProductWarehouse` model.

## 2. Stock Management Architecture
Stock is no longer a single scalar value attached to a `Product`. It is now tracked relationally via `ProductWarehouse`. This solves the multi-location problem.
- **Physical Quantity**: The actual total count sitting in the building.
- **Reserved Quantity**: Stock that is physically there, but allocated to an un-dispatched Sales Order.
- **Available Quantity**: Calculated dynamically (`Quantity - Reserved Quantity`). This is what the eCommerce frontend will display.
- **Reorder Math**: `minimumQuantity` and `reorderPoint` are tracked *per warehouse*, allowing a localized supply chain (e.g., the Alaska warehouse keeps a higher buffer of snow shovels than the Florida warehouse).

## 3. Future Scalability
- **Transfers**: The `moveStock` primitive in the service layer is designed to support a future `StockTransfer` workflow, moving goods between Company Warehouses safely within a Prisma transaction.
- **Accounting Isolation**: This architectural layer is purely physical/operational. When an adjustment or dispatch occurs, the `inventoryAccountingService` (built in Phase 1I) will handle the financial translation, ensuring absolute decoupling of physical stock logic from financial ledger logic.

## 4. Multi-Company Security Model
The entire hierarchy is rooted in the `companyId`. A `ProductWarehouse` row enforces a strict triangular constraint: The Product's `companyId` must match the Warehouse's `companyId`. This prevents tenant data bleed physically at the database level.
