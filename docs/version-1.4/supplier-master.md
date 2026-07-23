# Enterprise Supplier Master (Version 1.4 Phase 1)

## Architecture Overview
The Enterprise Supplier Master serves as the foundational data module for the entire Procurement lifecycle (Version 1.4). Mirroring the design philosophy of the Customer Master, it centralizes vendor identity, financial settings, contact points, and security configurations.

## Database Models
The architecture introduces several interconnected models, replacing/extending the basic `Supplier` placeholder from earlier phases:
1. **`Supplier`**: The core entity storing identity, tax details (VAT, Trade License), credit limits, payment terms, and status.
2. **`SupplierCategory`**: Classifies vendors (e.g., Raw Materials, IT Services, Logistics) for reporting and routing purposes.
3. **`SupplierAddress`**: Supports 1-to-Many addresses with `type` tags (BILLING, SHIPPING, WAREHOUSE).
4. **`SupplierContact`**: Supports 1-to-Many employee contacts per vendor, handling varying designations and primary markers.
5. **`SupplierBankAccount`**: Stores secure banking routing details for future `SupplierPayment` execution.
6. **`SupplierDocument`**: A digital locker for vendor NDAs, Tax Forms, and Contracts.
7. **`SupplierCommunicationLog`**: Maintains a CRM-like timeline of system events, blocking actions, or general notes.

## Supplier Lifecycle & Statuses
A strict `SupplierStatus` enum governs vendor usability:
- **ACTIVE**: Fully permitted to participate in RFQs, issue Invoices, and receive POs.
- **INACTIVE**: Temporarily paused; cannot be used in new transactions.
- **BLOCKED**: Prevented from receiving new Purchase Orders (e.g., pending dispute), but existing financial matching may proceed.
- **BLACKLISTED**: Permanently banned. The `validateSupplier()` service physically blocks all new transaction generation.

## Security & RBAC
- **Multi-Tenancy:** Every relational query inside `supplierService.ts` aggressively filters by `companyId`.
- **Portal Preparation:** Added `isPortalActive` and `portalPassword` fields. Like the Customer Portal, vendors will be able to log in to submit RFQ bids without possessing internal `User` roles.
- **RBAC Roles:** The UI/API layers should enforce `SUPPLIER_VIEW`, `SUPPLIER_CREATE`, `SUPPLIER_UPDATE`, `SUPPLIER_DELETE`, `SUPPLIER_BLOCK`, and `SUPPLIER_EXPORT`.

## Audit Logging
The `logAudit` service (from V1.3) natively tracks:
- Initial Vendor Creation.
- Profile and category updates.
- Highly sensitive alterations (e.g., modifying `creditLimit` or `paymentTerms`).
- `blockSupplier` and `unblockSupplier` events.

## Future Integrations
- **Phase 2 (Purchase Requisition):** Will allow users to nominate preferred suppliers.
- **Phase 3 (RFQ):** Will broadcast quotes to suppliers matching specific `SupplierCategory`.
- **Phase 5 (Supplier Invoice):** Will pull `currency` and `paymentTerms` directly from this Master.
