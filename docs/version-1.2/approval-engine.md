# Version 1.2 Approval Engine Implementation

## Architecture

The Approval Engine provides a centralized, dynamic framework to handle multi-level approvals across Shohoj Ledger. Rather than hardcoding simple string statuses (e.g., "PENDING", "APPROVED") within individual models like `LeaveRequest` or `Expense`, the system relies on this generic engine to map out multi-step hierarchies (e.g., Department Manager -> HR -> Finance) dynamically per company.

## Models Created

### 1. `ApprovalFlow`
- **Purpose**: A configured template defining how a specific process (e.g., Leave Approval) should execute.
- **Fields**: `id`, `companyId`, `name`, `description`, `moduleKey`, `isActive`, `createdById`, `createdAt`, `updatedAt`.
- **Relations**: `Company`, `User` (creator), `ApprovalStep`, `ApprovalRequest`.

### 2. `ApprovalStep`
- **Purpose**: A specific level in the `ApprovalFlow`. Defines *who* is responsible for this stage (a specific user, a role, or a dynamic relationship like "Manager").
- **Fields**: `id`, `companyId`, `approvalFlowId`, `stepOrder`, `approverType`, `approverValue`, `required`, `createdAt`.

### 3. `ApprovalRequest`
- **Purpose**: A runtime instance representing an ongoing approval process for a specific entity (e.g., a specific Expense record).
- **Fields**: `id`, `companyId`, `approvalFlowId`, `entityType`, `entityId`, `requesterId`, `currentStep`, `status`, `createdAt`, `updatedAt`.
- **Relations**: `Company`, `User` (requester), `ApprovalFlow`, `ApprovalHistory`.

### 4. `ApprovalHistory`
- **Purpose**: An immutable audit trail of every action (Approve, Reject, Forward) taken on an `ApprovalRequest`.
- **Fields**: `id`, `companyId`, `approvalRequestId`, `userId`, `action`, `comment`, `createdAt`.

## Security & Multi-Company Isolation

- **Enforced Tenant Isolation**: Every core model in the Approval Engine explicitly includes the `companyId` field, and foreign key constraints map back to the `Company` model. Any service querying these tables must inject `companyId` into the `where` clause.
- **Granular RBAC**: The platform permissions now include `APPROVAL_VIEW`, `APPROVAL_CREATE`, `APPROVAL_UPDATE`, `APPROVAL_APPROVE`, and `APPROVAL_REJECT`. 

## Approval Lifecycle

1. **Initiation**: A user submits a request (e.g., an Expense). An `ApprovalRequest` is generated linked to the `ApprovalFlow` associated with Expenses for that company. Status is `PENDING`.
2. **Evaluation**: The system determines the approver for `currentStep = 1` using `approverType` (Role, User, Manager).
3. **Action**: The approver invokes `approveRequest` or `rejectRequest`.
   - If approved and more steps remain, `currentStep` increments.
   - If approved and no steps remain, status transitions to `APPROVED`.
   - If rejected, status transitions to `REJECTED`.
4. **History**: Every action generates an `ApprovalHistory` record.

## Future Module Integration

The engine is completely decoupled from existing models. To integrate in future phases:
- Existing models (like `Expense`) will point their status queries toward the `ApprovalRequest` model via `entityType="EXPENSE"` and `entityId=expense.id`.
- Background hooks (Approval Created, Approved, Rejected) will sync the final outcome back to the original entity or dispatch notifications.
- We will tie this directly into the new `AuditEvent` model.

## Risks

- **Orphaned Requests**: If an entity (e.g., an Expense) is hard-deleted, its corresponding `ApprovalRequest` might be orphaned if cascading deletes aren't strictly handled on the application level (since there is no hard DB foreign key for polymorphic `entityId`).
- **Approver Unavailability**: If an assigned user is deactivated, workflows could stall. We must implement delegation or fallback mechanisms.
