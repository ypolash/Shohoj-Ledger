# Security Impact Analysis (Version 1.2)

## 1. Multi Branch Data Boundaries
- **Risk**: Accidental data leakage between branches within the same company.
- **Mitigation**: Update all Data Access Layer (DAL) queries to filter by both `companyId` and `branchId` based on the user's active session context.

## 2. API Platform & Webhooks
- **Risk**: API Keys leaking; Unauthenticated webhook triggering; DoS attacks via webhooks.
- **Mitigation**: 
  - Store API Keys as salted hashes, not plain text.
  - Implement strict rate limiting for API keys.
  - Webhooks must include HMAC signatures to verify payload integrity.

## 3. Workflow & Approval Engines
- **Risk**: Privilege escalation if users can modify workflow steps to grant themselves approvals.
- **Mitigation**: Strict RBAC required for `Workflow` and `ApprovalFlow` mutations. Require re-authentication for critical approvals (e.g., high-value financial transfers).

## 4. AI Intelligence
- **Risk**: Exposure of PII (Personally Identifiable Information) or financial data to external AI models.
- **Mitigation**: Data anonymization pipeline before passing data to any external LLM/AI service, or utilize in-house secure AI infrastructure.

## 5. Audit Logging Expansion
- The `GlobalAuditLog` must be updated to track API Key usage, Workflow modifications, and Approval actions meticulously.
