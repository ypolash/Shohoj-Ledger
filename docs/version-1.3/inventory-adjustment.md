# Enterprise Inventory Adjustment & Reconciliation (Phase 2K)

## 1. Architecture
The Phase 2K Inventory Adjustment engine is the absolute final authority on physical stock corrections. In legacy systems, administrators often run direct database queries or overwrite values in a "Products" table to fix miscounts. In Version 1.3, this behavior is strictly prohibited. If the physical reality of the warehouse differs from the system reality, an `InventoryAdjustment` must be created, approved, and posted. 

## 2. Adjustment Workflow
1. **DRAFT**: A warehouse clerk performs a physical cycle count. They input the `systemQuantity` vs the `physicalQuantity`. The system calculates the `adjustmentQuantity` (Variance).
2. **PENDING_APPROVAL**: A manager reviews the variance (e.g., "Why did we lose 50 laptops?").
3. **APPROVED**: The variance is authorized for ledger posting.
4. **POSTED**: The `postAdjustment()` method executes. This triggers the physical induction or deduction via the `StockMovement` ledger and locks the record.
5. **CANCELLED**: Allows voiding a draft or pending adjustment.

## 3. Strict Validation & Logic Rules
- **Variance Polarity Enforcement**: The service explicitly prevents logical contradictions. If the `adjustmentType` is `LOSS`, `DAMAGE`, `SCRAP`, etc., the math mathematically prevents the variance from being positive. If `GAIN` or `FOUND`, it prevents negative variances.
- **State Integrity**: An adjustment cannot be cancelled once it is `POSTED`. To fix a posted mistake, a new `CORRECTION` adjustment must be created.

## 4. Audit & Immutability (The "No Duplicate Logic" Rule)
In strict accordance with the Version 1.3 blueprint, `inventoryAdjustmentService.ts` does NOT perform direct math on `ProductWarehouse.quantity`.
When an adjustment is posted, the `adjustmentQuantity` (which can be positive or negative) is passed directly to `stockMovementService.recordMovement(ADJUSTMENT)`. The Stock Movement Engine safely processes the atomic transaction, updating the warehouse balances while maintaining a perfect, immutable audit trail.

## 5. Security & Isolation
- Added `ADJUSTMENT_VIEW`, `ADJUSTMENT_CREATE`, `ADJUSTMENT_APPROVE`, `ADJUSTMENT_POST`, and `ADJUSTMENT_CANCEL` to `defaultPermissions.ts`.
- The `companyId` constraint natively forces every adjustment, line item, and warehouse lookup to remain perfectly isolated to the tenant.

## 6. Accounting Ledger Integration
The `postAdjustment()` method contains the strategic hook for the Posting Engine. This solves the fundamental ERP challenge: "Where does the money go when stock is lost?"
- **Inventory Loss**: The Posting Engine will debit `Inventory Loss/Shrinkage Expense` and credit the `Inventory Asset` account.
- **Inventory Gain**: The Posting Engine will debit the `Inventory Asset` account and credit `Inventory Gain/Found` equity or income account.
Users will NEVER create manual Journal Entries for inventory shrink.
