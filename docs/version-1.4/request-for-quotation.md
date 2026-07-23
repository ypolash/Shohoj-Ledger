# Enterprise Request For Quotation (RFQ) - Version 1.4 Phase 3

## Architecture Overview
The Request For Quotation (RFQ) module bridges the gap between internal demand (Purchase Requisitions) and external supply (Suppliers). It acts as the gateway for soliciting competitive bids from the market before forming legal commitments (Purchase Orders).

## RFQ Lifecycle
The `RequestForQuotation` model handles the outbound request to suppliers.
- **1-to-Many:** One Purchase Requisition can spawn multiple RFQs if different lines need to be sourced from different vendors.
- **Workflow:** `DRAFT` (preparing documents) -> `ISSUED` (sent to vendors) -> `CLOSED` (no longer accepting quotes) -> `CANCELLED`.
- **RBAC:** Requires `RFQ_VIEW`, `RFQ_CREATE`, `RFQ_ISSUE`, `RFQ_CLOSE`, `RFQ_CANCEL`.

## Supplier Quotation Flow
The `VendorQuotation` model captures inbound pricing, terms, and conditions from Suppliers.
- **Validation constraints:** Cannot attach quotes to a `CLOSED` or `CANCELLED` RFQ. Cannot process quotes from `BLOCKED` or `BLACKLISTED` Suppliers.
- **Financial Architecture:** Quotes capture the `currency` and a strict breakdown of `subtotal`, `discount`, `tax`, `shipping`, and `total`. They also track `leadTime` and `paymentTerms`.
- **Workflow:** `DRAFT` -> `SUBMITTED` (supplier locked) -> `UNDER_REVIEW` -> `ACCEPTED` / `REJECTED` / `EXPIRED`.
- **RBAC:** Requires `VENDORQUOTATION_VIEW`, `VENDORQUOTATION_REVIEW`.

## Security & Audit
- **Strict Isolation:** `{ companyId }` multi-tenancy validation natively injected at every database transaction across both `rfqService.ts` and `vendorQuotationService.ts`.
- **Immutable Timestamps:** `issueDate` and `closingDate` govern the bidding window mathematically.
- **Audit Logging:** Integrated with the core `logAudit` framework. Status changes immediately stamp the central `GlobalAuditLog`.

## Future Vendor Comparison Integration
- **Phase 4 (Vendor Comparison):** The engine will query multiple `VendorQuotation` lines tied to a single `RequestForQuotationLine` to mathematically rank the best bids based on `unitPrice`, `leadTime`, and `Supplier` rating.
- Once the winning `VendorQuotation` is `ACCEPTED`, the procurement process moves to the final stage: the Purchase Order generation.
