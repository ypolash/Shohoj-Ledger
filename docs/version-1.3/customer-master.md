# Enterprise Customer Master

**Version 1.3 - Phase 3A**

## Architecture

The Customer Master serves as the single source of truth for all CRM, Sales, and Accounting modules. This new architecture introduces isolation of customer core details from related entities to allow for more granular control, auditing, and scalability across multi-branch and multi-company environments.

The architecture comprises:
- `CustomerGroup`: Classifies customers (e.g., Retail, Wholesale, VIP).
- `Customer`: Core entity containing essential business details, credit management, and identification.
- `CustomerAddress`: Normalizes customer addresses to support multiple addresses (Billing, Shipping, Office, Warehouse).
- `CustomerContact`: Normalizes contact persons to handle complex organizational structures of B2B clients.

All database queries strictly enforce `companyId` for tenant isolation.

## Customer Lifecycle

1. **Creation**: Customers are created and assigned a unique `customerCode` (e.g., `CUST-YYYYMMDD-XXXX`).
2. **Status Changes**: The customer lifecycle flows through three statuses:
   - `ACTIVE`: The customer is fully operational and can participate in new transactions.
   - `INACTIVE`: The customer is temporarily disabled. No new transactions can be initiated.
   - `BLOCKED`: The customer is flagged, usually for credit, compliance, or fraud issues.
3. **Tracking**: Every significant action on the customer (status change, credit update) is tracked using `GlobalAuditLog`.

## Customer Groups

Customers can be categorized using `CustomerGroup`. This facilitates:
- Bulk pricing rules (`priceLevel`).
- Targeted marketing and notifications.
- Filtered reports in analytics dashboards.

## Credit Management

Enterprise-grade credit management is integrated at the core layer. 
- `creditLimit`: The maximum outstanding balance allowed.
- `creditDays`: The maximum number of days allowed for payment terms.
- Changing credit limits requires `CUSTOMER_UPDATE` permissions and is strictly audited using the `GlobalAuditLog` system to ensure compliance.

## Security

- **Multi-Tenant Isolation**: Every API endpoint and service method must include `companyId`.
- **RBAC**: Handled natively by the `Permission` and `Role` models. New permissions added:
  - `CUSTOMER_VIEW`: Read access to customers.
  - `CUSTOMER_CREATE`: Permission to onboard new customers.
  - `CUSTOMER_UPDATE`: Permission to edit details or change credit limits.
  - `CUSTOMER_DELETE`: Permission to remove a customer (usually soft-delete or archival in future).
  - `CUSTOMER_EXPORT`: Permission to download customer data.

## Audit

Full auditability is provided via `GlobalAuditLog`. We track:
- Customer creation (capturing the creating `userId`).
- Profile updates.
- Credit limit changes.
- Status changes.
- Group assignments.

## Future Integrations

This module serves as the foundational pillar for Version 1.3 Phase 3B and onwards.
- **Lead Management (Phase 3B)**: Leads will seamlessly convert into Customers.
- **Quotation & Sales Order**: Will reference `Customer` to enforce credit limits and fetch billing/shipping addresses dynamically.
- **Delivery**: Will use `CustomerAddress` to guide warehouse operations.
- **Invoice & Payments**: Integrates with the General Ledger, generating `LedgerEntry` referencing `customerId`.
- **Returns**: Will validate against `Customer` history.
- **CRM Analytics**: Dashboards will aggregate revenue, outstanding balances, and order frequency by `CustomerGroup` and `Customer`. 

**Important Notice:** The legacy `Client` model is preserved for backward compatibility and should not be modified until the full deprecation phase is reached.
