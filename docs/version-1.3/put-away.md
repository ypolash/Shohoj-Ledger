# Enterprise Put-away Strategy (Phase 2H)

## 1. Architecture
The Phase 2H Put-away engine formalizes the final step of inbound logistics. Rather than Goods Receipts automatically throwing inventory into a generic "Warehouse" bucket, Phase 2G places them in a logical Receiving Zone. Phase 2H generates a `PutAwayTask` which explicitly commands a forklift driver or warehouse clerk to move the stock from the Receiving Zone/Bin to the final Storage Zone/Bin.

## 2. Put-away Workflow
1. **PENDING**: A task is generated containing the `goodsReceiptId` and lines to put away.
2. **ASSIGNED**: A specific Employee UUID is attached via `assignTask()`.
3. **IN_PROGRESS**: The worker accepts the task on their scanner.
4. **EXECUTION (`moveStock`)**: As the worker scans the `fromBin` and `toBin`, the service executes a `BIN_TRANSFER_OUT` and `BIN_TRANSFER_IN` via the `stockMovementService`.
5. **COMPLETED**: The task is formally closed once all `completedQuantity` values match the requested `quantity`.

## 3. Bin Recommendation Strategy
The `recommendBin()` function establishes the groundwork for Directed Put-away logic. It prioritizes bins where the `productId` is already stored (to prevent warehouse fragmentation). If the product is new, it intelligently suggests the nearest available `isActive: true` bins.

## 4. Strict Validation
- `validateTask()` ensures that you cannot execute movements on a task that has been `CANCELLED` or `COMPLETED`.
- `moveStock()` mathematically blocks workers from putting away more inventory than the `PutAwayTaskLine` explicitly authorized.

## 5. Security & Isolation
- Added `PUTAWAY_VIEW`, `PUTAWAY_ASSIGN`, `PUTAWAY_EXECUTE`, and `PUTAWAY_CANCEL` to `defaultPermissions.ts`.
- The `companyId` constraint natively forces every task and bin lookup to remain perfectly isolated to the tenant.

## 6. Audit Immutability (The "No Duplicate Logic" Rule)
Because this is Version 1.3, we do NOT write a separate put-away audit log. The `moveStock()` method explicitly delegates the transaction to `stockMovementService.recordMovement()`, recording the `fromBinId` and `toBinId`. Therefore, the general ledger of physical stock (`StockMovement`) serves as the single source of truth for the audit trail.
