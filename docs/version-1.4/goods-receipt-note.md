# Goods Receipt Note (GRN) Module

## Architecture

The **Enterprise Goods Receipt Note (GRN)** module is the cornerstone of the Enterprise Procurement framework that links external supplier commitments (Purchase Orders) to internal inventory tracking and accounting liabilities.

**CRITICAL RULE:** 
The GRN is the **ONLY** procurement document allowed to interact with the Inventory engine. Purchase Orders, RFQs, and Requisitions never create stock movements or update the ledger.

## Receiving Workflow

1. **DRAFT:** A GRN is drafted against a specific `PurchaseOrder`. A Purchase Order can have multiple GRNs against it.
2. **PENDING_APPROVAL:** Submitted for management approval.
3. **APPROVED:** Approved to receive goods.
4. **RECEIVED:** Goods physically arrive and the receiving clerk enters received and rejected quantities. Inventory modules are triggered.
5. **PARTIALLY_RECEIVED:** PO status is updated to reflect an incomplete fulfillment.
6. **CANCELLED:** GRN is discarded.

## Inventory Integration

When `receiveGoods()` is executed on an APPROVED GRN:
- **StockMovement:** A stock movement of type `IN` and source `GOODS_RECEIPT` is logged against the exact `warehouseId` and `productId`.
- **ProductWarehouse:** The aggregated summary table is upserted, incrementing the total available quantity for that warehouse.

## FIFO Creation

The module heavily interacts with the `ValuationService` by creating a new `InventoryValuationLayer`.
- Calculates the received quantity.
- Queries the parent `PurchaseOrderLine` to fetch the specific `unitPrice`.
- Creates a new `InventoryValuationLayer` tracking this exact stock influx, preserving the procurement cost basis for future outbound transactions.

## Batch Handling

If a batch item is received, the GRN requires the user to specify the `batchId`. The `BatchService` is invoked to increment the quantity available in that specific `InventoryBatch`.

## Serial Handling

If serial items are received, the `SerialService` is called to activate the `InventorySerial` items and bind them to the incoming `GoodsReceiptLine`.

## Audit

The `GlobalAuditLog` securely traces all major actions:
- **GRN Creation:** Tracking `CREATE` against the GRN.
- **Approvals:** Tracking `APPROVAL` with the user ID.
- **Goods Receipt:** Tracking the execution of `receiveGoods` which impacts stock, logging partial receives and rejected quantities.

## Security

**RBAC Enforcement:**
- `GRN_VIEW`: Can view historical GRNs.
- `GRN_CREATE`: Can draft GRNs against OPEN POs.
- `GRN_APPROVE`: Can approve GRNs.
- `GRN_RECEIVE`: Receiving clerk who actually confirms stock arrival.
- `GRN_CANCEL`: Can revoke an active GRN.

Tenant isolation is heavily enforced via the `companyId` composite indexes applied to all major reads/writes.

## Future Supplier Invoice Integration

This module does **NOT** post journal entries. The future **Supplier Invoice** (Phase 7) will perform a three-way match:
`Purchase Order` <-> `Goods Receipt Note` <-> `Supplier Invoice`.
Only upon invoice approval will the `PostingEngine` create the Accounts Payable liability.
