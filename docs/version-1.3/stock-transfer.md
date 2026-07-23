# Enterprise Stock Transfer Workflow (Phase 2J)

## 1. Architecture
The Phase 2J Stock Transfer engine controls the physical movement of goods between logical boundaries. Unlike a basic bin-to-bin put-away task, a `StockTransfer` represents a formal request to move inventory between different Warehouses, requiring shipping, receiving, and potential approval workflows.

## 2. Transfer Lifecycle
1. **DRAFT**: A warehouse manager creates a request detailing `fromWarehouseId` and `toWarehouseId`.
2. **PENDING_APPROVAL**: Optional state requiring secondary sign-off (based on company threshold logic).
3. **APPROVED**: Transfer is authorized.
4. **IN_TRANSIT**: The `shipTransfer()` method executes. This formally removes the stock from the `fromWarehouseId` via `TRANSFER_OUT` in the `StockMovement` ledger. The inventory is now logically in transit.
5. **PARTIALLY_RECEIVED**: As trucks arrive at the destination, the `receiveTransfer()` method executes `TRANSFER_IN` movements into the `toWarehouseId`.
6. **COMPLETED**: The transfer is formally closed when `receivedQuantity` strictly equals the requested `quantity` for all lines.

## 3. Strict Validation
- **Source and Destination**: Cannot be the same Warehouse.
- **Mathematical Integrity**: `receiveTransfer()` strictly blocks workers from receiving more items than what was physically shipped.
- **State Machine Rules**: A transfer cannot be cancelled once it has been `APPROVED` or shipped, guaranteeing that in-flight inventory isn't orphaned.

## 4. Audit & Immutability (The "No Duplicate Logic" Rule)
In strict accordance with the Version 1.3 architecture, `stockTransferService.ts` does NOT write to `ProductWarehouse`. 
When stock is shipped, it delegates to `stockMovementService.recordMovement(TRANSFER_OUT)`.
When stock is received, it delegates to `stockMovementService.recordMovement(TRANSFER_IN)`.
The `StockMovement` ledger remains the absolute single source of truth for the entire supply chain.

## 5. Security & Isolation
- Added `TRANSFER_VIEW`, `TRANSFER_CREATE`, `TRANSFER_APPROVE`, `TRANSFER_SHIP`, `TRANSFER_RECEIVE`, and `TRANSFER_CANCEL` to `defaultPermissions.ts`.
- The `companyId` constraint natively forces every transfer, line item, and warehouse lookup to remain perfectly isolated to the tenant.

## 6. Future Accounting Integration
The `completeTransfer()` method contains the strategic hook for the Posting Engine. In future iterations where Warehouses may belong to different legal branches or cost centers, the completion of a transfer will trigger inter-company or inter-branch Journal Entries to recognize the shift in asset valuation.
