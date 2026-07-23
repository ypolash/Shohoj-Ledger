# Enterprise Purchase Order Engine (Version 1.4 Phase 5)

## Architecture Overview
The Purchase Order (PO) is the central commercial commitment made by the company to a Supplier. It represents the final step of the upstream procurement pipeline (Requisition -> RFQ -> Comparison -> PO).

**CRITICAL ARCHITECTURAL RULES:**
- **No Inventory Impact:** Creating, Approving, or Issuing a PO mathematically guarantees NO changes are made to the `Warehouse` stock balances. Stock is strictly managed downstream by the **Goods Receipt Note (GRN)**.
- **No Accounting Impact:** Creating, Approving, or Issuing a PO mathematically guarantees NO changes are made to the General Ledger. The GL is strictly updated downstream by the **Supplier Invoice** (via the Posting Engine).

## Data Models
1. **`PurchaseOrder`**: Captures header-level financial commitments (`subtotal`, `discountAmount`, `taxAmount`, `shippingAmount`, `totalAmount`), `Supplier` routing, and multi-signature approval metadata.
2. **`PurchaseOrderLine`**: Captures granular unit economics (`unitPrice`, line-level `discountAmount`, `taxAmount`), target receiving `warehouseId`, and `receivedQuantity` tracking (for future GRN sync).

## Integration with Upstream Modules
A PO can be generated through two primary channels:
1. **Manual Creation**: Direct PO entry for simple, low-value, or pre-negotiated contracts.
2. **Algorithmic Conversion**: The `convertVendorComparison()` service injects data directly from the winning `VendorQuotation` (from Phase 4), carrying over the negotiated currency, unit pricing, and shipping terms precisely.

## Status Lifecycle
- **DRAFT**: Commercial terms are being negotiated or formulated.
- **PENDING_APPROVAL**: Locked by creator, awaiting managerial review.
- **APPROVED**: Financial commitment authorized.
- **OPEN**: Order officially issued to the Supplier.
- **PARTIALLY_RECEIVED**: Supplier has delivered some (but not all) goods.
- **RECEIVED**: All lines strictly met `receivedQuantity == quantity`.
- **CANCELLED**: Order aborted.
- **CLOSED**: Order manually terminated (e.g., short-closed if a supplier cannot fulfill the remaining 5% of a shipment).

## Security & RBAC
- **Strict Tenancy:** `{ companyId }` multi-tenant scoping natively protects all API mutations.
- **Action-based RBAC:** Access control enforces distinct privileges for `PURCHASEORDER_VIEW`, `_CREATE`, `_UPDATE`, `_APPROVE`, `_CANCEL`, and `_CLOSE`.
- **Immutable Tracing:** Every status transition automatically triggers an immutable audit log entry (via `logAudit`) associated with the responsible `User`.

## Future Integration (Phase 6)
In Phase 6, the **Goods Receipt Note (GRN)** module will be introduced. It will pull active `OPEN` lines from the Purchase Order and orchestrate the physical receiving process. Only the GRN module will possess the authority to update warehouse stock and trigger the Posting Engine for inventory valuation entries.
