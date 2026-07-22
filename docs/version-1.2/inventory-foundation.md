# Version 1.2 Advanced Inventory & Supply Chain Foundation

## Architecture

This phase introduces a robust data structure required for true supply chain tracking, decoupled from legacy simple inventory states. It supports immutable transaction auditing (`InventoryTransaction`), multi-warehouse routing, and formal Supplier/Purchase Order lifecycles.

Because `Warehouse`, `Supplier`, and `PurchaseOrder` already existed in v1.1 in a basic format, they were strictly *extended* rather than replaced. All existing `status` and legacy relation fields remain intact to ensure older APIs do not break.

## Models Prepared/Created

### 1. `Warehouse` (Extended)
- **New Fields Added**: `branchId`, `address`, `isActive`.
- **Purpose**: Maps inventory locations optionally to a `Branch`. Retains compatibility with legacy `status` flag while adding the standard boolean toggle.

### 2. `Supplier` (Extended)
- **New Fields Added**: `taxNumber`, `isActive`.
- **Purpose**: Tracks vendors.

### 3. `PurchaseOrder` (Extended)
- **New Fields Added**: `warehouseId`, `orderNumber`, `orderStatus` (using `PurchaseOrderStatus` Enum), `createdById`.
- **Purpose**: Formalizes the draft -> approval -> receive lifecycle of stock purchasing.

### 4. `InventoryTransaction` (New)
- **Purpose**: An immutable ledger of every single stock movement. Replaces mutable stock increment operations for auditing purposes. 
- **Fields**: `id`, `companyId`, `warehouseId`, `productId`, `transactionType` (IN/OUT/TRANSFER/ADJUSTMENT), `quantity`, `referenceType`, `referenceId`, `createdBy`, `createdAt`.

### 5. `StockTransfer` (New)
- **Purpose**: Manages stock moving between two warehouses, supporting a transitionary `PENDING` state until `COMPLETED`.
- **Fields**: `id`, `companyId`, `fromWarehouseId`, `toWarehouseId`, `status`, `createdBy`, `createdAt`, `completedAt`.

## Future Accounting Integration

Currently, an `InventoryTransaction` only affects physical item quantity. In a future phase, completing a `PurchaseOrder` or triggering a `StockTransfer` will automatically post an event to the `WorkflowEngine` (Phase 2), which will in turn trigger the `Accounting` module to generate a formal `LedgerEntry` (e.g., Credit Accounts Payable, Debit Inventory Asset). 

## Migration Strategy

Data currently residing in the old `StockTransaction` table will eventually be mapped to `InventoryTransaction` through a dedicated migration script when the business logic cuts over. Old `status` strings (like `"PENDING"`) will be mapped to the strict `enum` types (`PurchaseOrderStatus.PENDING`). Existing APIs pointing to `StockTransaction` will run untouched until the UI switches to `InventoryTransaction`.

## Risks

- **Stock Discrepancy**: Because we maintain both `StockTransaction` (legacy) and `InventoryTransaction` (new) in the schema, developers might mistakenly query the old model for stock levels if they are unaware of the cut-over. (Mitigation: Add deprecation tags to the old models in the GraphQL/TRPC layers when the switch occurs).
- **Accounting Drift**: If an inventory transfer succeeds but the downstream accounting ledger entry fails (network timeout), assets might falsely inflate on balance sheets. (Mitigation: Ensure all future business logic wraps inventory movements and ledger writes within a single atomic Prisma `$transaction`).
