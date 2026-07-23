# Security Review (Phase 1K)

## 1. Multi-Tenant Isolation
Shohoj Ledger relies on logical tenant isolation within a shared PostgreSQL database.
- **Enforcement**: The `companyId` parameter is strictly required on every single validation, read, and write method across the Phase 1 architectural stack. 
- **Query Protection**: Prisma's strong typing guarantees that a missing `companyId` filter in a `where` clause will fail to compile if designed strictly, preventing cross-tenant data bleed.

## 2. Role-Based Access Control (RBAC)
We successfully integrated granular permissions into `defaultPermissions.ts`.
- **Decoupling**: By splitting `POSTING_EXECUTE` from `INVENTORY_POST` and `PAYROLL_POST`, operational managers can trigger their specific subsystem journals without having global access to the company's General Ledger.
- **Read/Write Split**: `BALANCESHEET_VIEW` is separated from `BALANCESHEET_EXPORT` to prevent unauthorized data exfiltration.

## 3. Audit Integrity
- **Immutability**: `LedgerEntry` facts cannot be altered once posted.
- **Traceability**: `createdById`, `referenceType`, and `referenceId` statically link every financial event directly back to the authenticated user and origin document (e.g., Sales Invoice UUID).
- **Voiding**: The reversal architecture preserves the original mistake in the database with a `VOID` status, ensuring an external auditor has complete visibility into corrected errors.

## 4. Risks Found
- **Branch Bleed**: While `companyId` isolation is rigorous, `branchId` is currently an optional parameter in the service methods. If a user with "Branch A" access executes a P&L report without explicit server-action validation, they might fetch data for the entire company.
- **Recommendation**: The upcoming API/Server-Action layer must strictly cross-reference the JWT/Session claims against the `branchId` before passing it to the service layer.
