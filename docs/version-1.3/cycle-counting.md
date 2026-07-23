# Enterprise Cycle Counting (Phase 2L)

## 1. Architecture
The Phase 2L Cycle Counting engine allows warehouses to verify inventory continuously without stopping operations (unlike a full year-end physical inventory count). It creates a structured, auditable workflow for generating counting tasks, recording physical quantities, and systematically resolving discrepancies.

## 2. Cycle Counting Workflow
1. **PENDING**: A cycle count is generated for specific bins/products.
2. **COUNTING**: The count is started and assigned to a worker.
3. **RECORDING**: As the worker scans bins and enters quantities, `recordCount()` calculates the exact `variance` between the ledger's `systemQuantity` and the worker's `countedQuantity`.
4. **APPROVED**: A manager reviews the variances and formally approves the count sheet.
5. **POSTED**: The `postVariance()` method executes. This is where the magic of Version 1.3 architecture occurs.

## 3. Strict Delegation (The "No Duplicate Logic" Rule)
In strict accordance with the blueprint, `cycleCountService.ts` DOES NOT modify `ProductWarehouse` balances, nor does it directly write to the `StockMovement` ledger, nor does it generate Accounting Journal Entries.
Instead, it acts as a purely operational data-collection tool. When `postVariance()` is called, it filters all lines with a non-zero variance and automatically generates a Phase 2K `InventoryAdjustment`.
It delegates 100% of the ledger correction, the accounting integration, and the physical stock induction to `inventoryAdjustmentService`.

## 4. Validation Rules
- **Live System Quantities**: When `createCycleCount()` is called, it actively queries `ProductWarehouse` to snapshot the exact `systemQuantity` existing at that millisecond.
- **Completion Mandate**: A count cannot be approved unless every single `CycleCountLine` has been successfully marked as `COUNTED`.

## 5. Security & Isolation
- Added `CYCLECOUNT_VIEW`, `CYCLECOUNT_CREATE`, `CYCLECOUNT_ASSIGN`, `CYCLECOUNT_APPROVE`, and `CYCLECOUNT_POST` to `defaultPermissions.ts`.
- The `companyId` constraint natively forces every count, line item, and warehouse lookup to remain perfectly isolated to the tenant.

## 6. Count Strategies (Future Ready)
Because the `CycleCountLine` explicitly targets a `productId`, `zoneId`, and `binId`, the service can natively support advanced WMS strategies like:
- **ABC Counting**: Selecting products based on their revenue impact.
- **Bin-based Counting**: Sending a worker to count "Aisle 4" regardless of what products are there.
- **Random Counting**: System-generated spot checks to deter shrinkage.
