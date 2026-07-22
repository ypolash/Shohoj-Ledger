# Security Test Report

## Threat Modeling Validation

### 1. Insecure Direct Object Reference (IDOR)

- **Vulnerability:** An attacker swaps an expense `id` in a PUT request to edit another company's data.
- **Validation:** The `verifyOwnership()` pre-flight check validates that the requested object's `companyId` strictly matches the `session.companyId`.
- **Status:** `PASS`. Protected. Returns `404 Not Found` to prevent enumeration.

### 2. Broken Authentication

- **Vulnerability:** Session hijacking or brute force logins.
- **Validation:** Token generation relies on cryptographically signed JWTs. Login route is now protected by a sliding-window `RateLimiter`.
- **Status:** `PASS`. Protected.

### 3. Privilege Escalation

- **Vulnerability:** An HR employee attempting to modify their own Salary record.
- **Validation:** The `requirePermission` guard enforces strict action-to-role mappings. Unless the HR role explicitly holds `PAYROLL_MANAGE`, the action is blocked.
- **Status:** `PASS`. Protected.

### 4. Injection Attacks

- **Vulnerability:** SQL Injection in reporting endpoints.
- **Validation:** Prisma ORM automatically parameterized all inputs. Raw queries (`$queryRaw`) are completely absent from user-facing inputs.
- **Status:** `PASS`. Protected.
