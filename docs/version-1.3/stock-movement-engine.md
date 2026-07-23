# Stock Movement Engine (Phase 2C)

## 1. Architecture
The Phase 2C Stock Movement Engine acts as the irrefutable chronological ledger for all physical and logical inventory changes.
While `ProductWarehouse` maintains the *current* state of physical inventory, the new `StockMovement` table records exactly *how* and *why* that state was reached. No service is allowed to run a direct Prisma update on `ProductWarehouse.quantity` without simultaneously generating a `StockMovement` record inside the same `$transaction`.

## 2. Movement Lifecycle
1. **Trigger**: An operational event (e.g., Purchase Receipt, Sales Fulfillment) invokes `stockMovementService`.
2. **Validation**: The engine validates the warehouse is active, the user has permissions, and the resulting stock will not fall below zero.
3. **Execution**: The underlying `ProductWarehouse` quantity is incremented or decremented.
4. **Audit Immutability**: A `StockMovement` row is generated containing the `quantity` delta, the calculated `balanceAfter`, and the precise `referenceType` (e.g., "Sales", "Adjustment") and `referenceId` (e.g., the UUID of the Invoice).

## 3. Supported Movement Types
- **Physical Increments**: `RECEIVE`, `TRANSFER_IN`, `ADJUSTMENT_IN`, `RETURN_IN`.
- **Physical Decrements**: `ISSUE`, `TRANSFER_OUT`, `ADJUSTMENT_OUT`, `RETURN_OUT`.
- **Logical Operations**: `RESERVE`, `RELEASE`. (These do not change the physical quantity, but lock the `reservedQuantity`. They generate a `StockMovement` row with `quantity: 0` for audit purposes).

## 4. Reverse Mechanics
Much like the Accounting Posting Engine, the Stock Movement Engine prevents deletion of history. 
If an erroneous `RECEIVE` is posted, the `reverseMovement` method generates an inverse `RETURN_OUT` movement, neutralizing the physical stock while keeping both the mistake and the correction permanently visible to auditors.

## 5. Security & Isolation
The entire engine strictly enforces the `companyId` boundary. A movement cannot be recorded without explicitly binding to a specific tenant. This prevents cross-tenant inventory manipulation.

## 6. Scalability Assessment
By modeling the movement history identically to the General Ledger (`JournalEntry` / `LedgerEntry`), the inventory system guarantees flawless point-in-time reconstruction. If a `ProductWarehouse` physical count is ever disputed, an auditor can query `getMovementHistory()` and mathematically prove the current balance by summing the delta quantities from the dawn of the fiscal year.
