# Enterprise Customer Portal Services (Version 1.3 Phase 3K)

## Overview
The Enterprise Customer Portal Services module exposes a secure, read-only (and partially writeable) API surface for external B2B customers. It allows clients to log in and self-serve their profiles, order histories, outstanding balances, and account statements. 

## Architecture
- **Database Model Enhancements:** 
  - The core `Customer` model now includes `portalPassword` and `isPortalActive` flags to manage external access independently of the internal `User` (staff) architecture.
- **Service Layer:** 
  - `lib/portal/customerPortalService.ts` aggregates data securely. Instead of implementing entirely new logic, it wraps existing CRM services (e.g., `calculateAvailableCredit()` from Phase 3H and `calculateCustomerBalance()` from Phase 3I).

## Authentication & Authorization Model
- **Authentication:** Completely isolated from internal ERP staff logins. Portal authentication verifies `companyId`, `email`, and `portalPassword` using standard bcrypt hashing.
- **Authorization (Row-Level Multi-tenant Isolation):** 
  - Every single service method mandates `companyId` and `customerId`.
  - The `validatePortalAccess()` middleware-like function strictly halts queries if a customer account has its `isPortalActive` flag disabled (e.g., due to credit holds or business termination).
  - Customers can only ever pull data mapping explicitly to their `customerId`.

## Portal Services Provided
- **Profile Management:** `getCustomerProfile()`, `updateCustomerProfile()` (limited to non-financial fields like contact info), and `changePassword()`.
- **Order Tracking:** `getQuotations()`, `getSalesOrders()`, `getDeliveries()`, and `getReturns()`.
- **Financial Visibility:** `getPayments()`, `getOutstandingBalance()`, and `getAccountStatement()`.
- **Dashboard Aggregation:** `getPortalDashboard()` provides a quick top-level view of active orders and real-time balances.
- **Document Handling:** `downloadDocuments()` provides the framework for secure PDF retrieval.

## Security & Audit
- **Zero-Trust Access:** A customer cannot view a Delivery Order unless the underlying `SalesOrder` is linked to their `customerId`.
- **Audit Logging:** Implemented specific `logAudit` events for:
  - `LOGIN`
  - Profile `UPDATE`
  - Statement `REPORT` generation
  - File `DOWNLOAD`
- **Future Preparations:** The architecture is designed to support MFA (Multi-Factor Authentication) and JWT-based mobile app integration natively.
