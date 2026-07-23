# Enterprise Procurement & Supplier Management Architecture (Version 1.4)

## Overview
The Enterprise Procurement module introduces a robust, multi-stage procurement lifecycle, establishing tight controls over corporate spending, supplier relationships, and inbound logistics. It acts as the purchasing counterpart to the Version 1.3 CRM & Sales engine, seamlessly integrating with the frozen Accounting, Inventory, and Warehouse modules without duplicating their core logic.

## Module Boundaries & Data Models
The architecture is divided into the following functional domains:

### 1. Supplier Master
- **Models:** `Supplier`, `SupplierContact`, `SupplierAddress`, `SupplierCategory`, `SupplierDocument`
- **Purpose:** Centralized repository for vendor data. Serves as the foundation for procurement operations, similar to the `Customer` master.

### 2. Sourcing & Requisition
- **Models:** `PurchaseRequisition`, `PurchaseRequisitionLine`, `PurchaseApproval`, `RequestForQuotation` (RFQ), `VendorQuotation`
- **Purpose:** Manages internal demands and competitive bidding. Employees submit requisitions; once approved, they can be broadcasted as RFQs to multiple suppliers for vendor evaluation.

### 3. Purchasing Execution
- **Models:** `PurchaseOrder`, `PurchaseOrderLine`
- **Purpose:** The legal commitment to buy. **Crucial integration:** A PO *does not* affect inventory or accounting balances directly. It only tracks ordered quantities.

### 4. Inbound Logistics & Quality Control
- **Models:** `GoodsReceiptNote` (GRN), `GoodsReceiptLine`, `PurchaseReturn`
- **Purpose:** Records physical delivery of goods. **Crucial integration:** This module triggers the `StockMovementService` (V1.3) to generate physical stock additions and calculate FIFO valuation layers.

### 5. Financial Settlement (Three-Way Match)
- **Models:** `SupplierInvoice`, `SupplierPayment`
- **Purpose:** The financial clearance engine. `SupplierInvoice` enforces Three-Way Matching (PO vs GRN vs Invoice). Once approved, it triggers the `PostingService` (V1.3) to create A/P Journal Entries. `SupplierPayment` manages cash outflows against these invoices.

---

## Procurement Lifecycle Workflow

```text
Internal Demand        Sourcing              Commitment            Logistics             Settlement
[Requisition]  --->  [RFQ/Vendor Quote] ---> [Purchase Order] ---> [Goods Receipt] --->  [Supplier Invoice]
     |                                                                   |                      |
(Approval)                                                        (Stock Movement)       (Posting Engine)
                                                                         |                      |
                                                                   [Purchase Return]      [Supplier Payment]
```

## Three-Way Matching Architecture
The most critical financial control in the system:
1. **Purchase Order (PO):** Defines what was requested and at what price.
2. **Goods Receipt Note (GRN):** Defines what was actually received (Quantity).
3. **Supplier Invoice:** Defines what the supplier is billing for.

**The Rule:** The `SupplierInvoice` service will systematically compare the Invoice lines against the GRN quantities and PO prices. The `PostingService` will *only* be invoked if the match is successful and explicitly approved by authorized finance personnel.

## Status Workflows
All transactional documents (`PurchaseRequisition`, `PurchaseOrder`, `SupplierInvoice`) follow a strict state machine:
- **DRAFT:** Initial creation, fully editable.
- **SUBMITTED:** Locked for review.
- **APPROVED:** Authorized for the next lifecycle stage.
- **REJECTED:** Returned to creator with notes.
- **CANCELLED:** Aborted.
- **COMPLETED:** Fully consumed (e.g., PO is fully received and invoiced).

## Integration Strategy (Version 1.3 Preservation)
- **Accounting:** `SupplierInvoice` and `SupplierPayment` strictly utilize the frozen V1.3 `PostingService`. They do not create direct `LedgerEntry` records.
- **Inventory & FIFO:** `GoodsReceiptNote` and `PurchaseReturn` strictly utilize the frozen V1.3 `StockMovementService`. Inventory is never updated directly.
- **Warehouse:** GRNs interact with the `WarehouseService` to map inbound stock to specific zones/bins.
- **Audit & Security:** All interactions require `companyId` filtering. The V1.3 `logAudit` framework will track all status changes and approvals.

## Security & Scalability
- **RBAC:** New roles will be introduced (e.g., `PROCUREMENT_VIEW`, `PROCUREMENT_APPROVE`, `INVENTORY_RECEIVE`, `AP_MANAGE`) mapped to existing `Permission` models.
- **Supplier Portal Preparation:** The `Supplier` model will be designed with isolated authentication flags (similar to the Customer Portal) to allow vendors to submit bids against RFQs directly in future phases.
- **Multi-Currency:** POs and Invoices will record `currency` and `exchangeRate` at the time of posting to prepare for multi-currency general ledgers.
