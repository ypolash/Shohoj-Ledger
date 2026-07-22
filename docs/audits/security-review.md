# Security Review

## Authentication
- **Token Format:** Uses JWT for API communication.
- **Payload Integrity:** The `companyId` and `roleId` are embedded securely inside the signed token payload. Client-side tampered payloads are cryptographically rejected.

## Access Control (RBAC)
- **Granularity:** Excellent. Move from boolean isAdmin checks to strict action-based permissions (e.g., `PAYROLL_MANAGE`).
- **Guard Layer:** `requirePermission` executes server-side, bypassing the risk of client UI manipulation.
- **Bypass Safety:** Owner bypass checks the specific `companyId`, safely preventing cross-tenant traversal.

## Multi-Tenant Isolation
- **Data Integrity:** Write actions (POST) use `getCompanyId()` strictly derived from the session, ignoring client-provided JSON IDs.
- **Anti-IDOR Mechanisms:** Updates and Deletes utilize `verifyOwnership`. If a cross-tenant record is requested, the system intentionally throws a `404 Not Found` rather than `403 Forbidden` to prevent adversarial ID enumeration.

## Vulnerabilities & Weaknesses
1. **Rate Limiting:** No API rate limiting exists (e.g., on `POST /api/auth/login`), rendering the platform susceptible to brute-force credential stuffing.
2. **CSRF:** Missing CSRF validation for mutating API routes.
3. **Session Revocation:** JWTs cannot be instantly revoked upon a role change until they naturally expire or a global blacklist is introduced.
4. **Audit Logging:** There is no generalized Audit Trail tracking *who* mutated *which* sensitive business record.

## Scores
- **Security:** 8.5 / 10
- **Data Isolation:** 9.5 / 10
