# Enterprise Inventory Valuation Engine (Phase 2M)

## 1. Architecture
The Phase 2M Valuation Engine converts physical stock quantities into financial assets. Prior to this phase, physical movement was tracked via the `StockMovement` ledger (Phase 2C), but the exact cost of goods was not strictly layered. 
Version 1.3 introduces the `InventoryValuationLayer` model. This isolates the financial reality (Costs, COGS, Asset Value) from the physical reality (Bins, Zones, Warehouses).

## 2. FIFO Algorithm
The system is hard-coded in Phase 2M to use **First-In, First-Out (FIFO)** as the production strategy.
- **Receiving (Inflow)**: When stock enters the warehouse (Goods Receipt, Transfer In, Found Adjustment), `createLayer()` is called. It creates a distinct financial layer locking in the `unitCost` for that exact `quantity`.
- **Issuing (Outflow)**: When stock leaves the warehouse (Picking, Transfer Out, Loss Adjustment), `consumeLayer()` is called. 
  - The algorithm queries all layers with `remainingQuantity > 0`, sorted by `createdAt ASC` (oldest first).
  - It sequentially deducts from the oldest layers until the requested quantity is fulfilled.
  - It strictly tracks exactly which layer provided the goods, and calculates the blended Cost of Goods Sold (COGS).

## 3. Strict Validation & Security
- **Negative Inventory Prevention**: `consumeLayer()` mathematically blocks any transaction that attempts to consume more stock than is financially available in the layers, throwing a Hard Error.
- **Tenant Isolation**: `companyId` strictly boundaries all data queries, preventing cross-tenant valuation bleed.
- **RBAC**: Integrated `VALUATION_VIEW`, `VALUATION_REBUILD`, and `VALUATION_REPORT` into `defaultPermissions.ts`.

## 4. Accounting Integration (No Duplicate Costing Logic)
The `consumeLayer()` method returns the exact mathematically verified COGS for an outflow transaction.
The application will then take this exact figure and pass it to the **Posting Engine**.
- **Issue/Sale**: Debit COGS, Credit Inventory Asset.
- **Shrink/Loss**: Debit Inventory Loss, Credit Inventory Asset.
Financial statements are guaranteed to perfectly match the valuation layers.

## 5. Future Valuation Methods
The `InventoryValuationLayer` includes a `valuationMethod` field, preparing the architecture to support LIFO, Weighted Average, or Specific Identification in future releases, without requiring schema modifications.

## 6. Enterprise Scalability
- The `calculateCOGS()` method allows for non-mutating simulation of consumption, enabling Sales Quoting tools to predict gross margins instantly.
- Hooks for `rebuildValuation()` are stubbed out for Phase 2N, preparing the system to chronologically replay all historical stock movements to heal the ledger if manual tampering occurred.
