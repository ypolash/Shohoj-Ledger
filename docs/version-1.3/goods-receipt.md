# Enterprise Purchase Receiving Workflow (Phase 2G)

## 1. Architecture
The Phase 2G Goods Receipt (GRN) workflow bridges the gap between Procurement (Purchase Orders) and the physical Warehouse. In Version 1.2, purchasing directly increased inventory balances. In Version 1.3, inventory can ONLY be increased through a formal, audited Goods Receipt process that leverages the `stockMovementService`.

## 2. Receiving Lifecycle
1. **DRAFT**: The GRN is created (typically matching a Purchase Order).
2. **RECEIVING**: Dock workers count the boxes and enter `receivedQuantity`. The truck leaves.
3. **INSPECTION (Quality Control)**:
   - `acceptedQuantity`: Goods are approved. This triggers the physical induction into the warehouse.
   - `rejectedQuantity`: Goods are damaged/incorrect. These are NOT inducted into the warehouse and will generate a debit memo to the supplier.
4. **PARTIAL**: Items are incrementally accepted/rejected.
5. **COMPLETED**: The GRN is formally closed. This is the exact moment the Accounting Engine is triggered to accrue the liability (GRNI - Goods Received Not Invoiced).

## 3. Deep Integration Architecture
The `acceptItems()` method acts as the master orchestrator for Phase 2:
- If the item is **Batch-controlled**, it calls `batchService.receiveBatch()`.
- If the item is **Serial-controlled**, it calls `serialService.receiveSerial()`.
- If the item is standard, it calls `stockMovementService.recordMovement()`.
In all three cases, the system guarantees that the `GoodsReceiptLine` is permanently linked to the exact Stock Movement audit row.

## 4. Rejection Handling
Crucially, rejected items NEVER hit the `ProductWarehouse` aggregation. By mathematically separating `receivedQuantity` from `acceptedQuantity`, the system handles the physical reality of the dock door (the truck brought 10 boxes) versus the financial reality of the balance sheet (only 8 boxes were good enough to pay for).

## 5. Security & Isolation
- Added `GOODSRECEIPT_VIEW`, `GOODSRECEIPT_CREATE`, `GOODSRECEIPT_COMPLETE`, and `GOODSRECEIPT_CANCEL` to `defaultPermissions.ts`.
- The `companyId` boundary is strictly enforced across the GRN, the Warehouse, the Supplier, and the Product mappings.

## 6. Accounting Readiness
The `completeReceipt()` method is architecturally positioned to hook directly into the Phase 1H Posting Engine. Because the GRN stores the `supplierId`, `warehouseId`, and exactly how many units were `acceptedQuantity`, the Posting Engine has 100% of the data required to generate an automated Journal Entry debiting Inventory and crediting Accounts Payable / GRNI.
