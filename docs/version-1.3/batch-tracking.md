# Enterprise Batch & Lot Tracking (Phase 2D)

## 1. Architecture
The Phase 2D architecture enables true enterprise traceability (such as food, pharmaceuticals, or industrial manufacturing) by introducing the `InventoryBatch` model.
This model sits *alongside* `ProductWarehouse`. The `ProductWarehouse` still maintains the absolute physical sum of a product in a building, but the sum of all active `InventoryBatch` rows for that product mathematically equals the `ProductWarehouse` total.

## 2. Batch Lifecycle & Statuses
- **ACTIVE**: Standard, usable batch stock.
- **RESERVED**: The entire batch is allocated to a pending order.
- **PARTIAL**: A mix of active and reserved.
- **EXPIRED**: Handled via `expireBatch()`. Prevents the system from issuing the batch.
- **QUARANTINE**: Handled via `quarantineBatch()`. Freezes the batch during quality audits.
- **CONSUMED**: Handled automatically when `Quantity == 0`.

## 3. The Stock Movement Engine Rule
The absolute architectural rule of Version 1.3 is preserved: **No service directly edits `ProductWarehouse`.**
Every mutating operation inside `batchService.ts` explicitly delegates the heavy lifting to `stockMovementService.recordMovement()`. The `batchService` simply manages the `InventoryBatch` rows and then injects the resulting `batchId` into the `StockMovement` audit row.

## 4. FEFO / FIFO Preparation
The `getBatchStock()` method dynamically orders batches by `expiryDate: "asc"`. 
- **FEFO** (First-Expired, First-Out): Can be executed instantly because the query sorts by Expiry.
- **FIFO** (First-In, First-Out): Can be derived by sorting by `receivedDate` if `expiryDate` is null.
This perfectly stages the upcoming automated fulfillment engine.

## 5. Security & Isolation
- Added `BATCH_VIEW`, `BATCH_MANAGE`, `BATCH_ADJUST`, and `BATCH_QUARANTINE` to `defaultPermissions.ts`.
- `validateBatch()` explicitly requires the `companyId` of the authenticated user to match the batch's `companyId`, ensuring strict tenant isolation. 
- Negative quantity prevention is structurally baked into `receiveBatch`, `issueBatch`, and `adjustBatch`.

## 6. Enterprise Audit Strategy
By linking `batchId` natively into the `StockMovement` table, the ERP can instantly trace a quarantined food lot from the Supplier Receipt, through warehouse transfers, and out to the exact Sales Invoice, enabling real-time product recalls.
