# Version 1.2 Workflow Automation Engine Foundation

## Architecture

The Workflow Automation Engine is designed to be the central processing hub for business rules across Shohoj Ledger. It standardizes how asynchronous operations, approvals, and complex rule sets are defined and executed, removing hardcoded logic from the core modules.

The foundation layer provides the schema and basic service signatures required to eventually migrate existing flows (like Leave Requests and Expense Approvals) into dynamic, configurable workflows.

## Models Created

### 1. `Workflow`
- **Purpose**: Represents a configured automation definition.
- **Fields**: `id`, `companyId`, `name`, `description`, `moduleKey`, `isActive`, `createdById`, `createdAt`, `updatedAt`.
- **Relations**: Belongs to a `Company` and a `User` (creator). Has many `WorkflowStep`s, `WorkflowTrigger`s, and `WorkflowExecution`s.

### 2. `WorkflowStep`
- **Purpose**: Represents an individual node in the execution graph of a Workflow.
- **Fields**: `id`, `workflowId`, `stepOrder`, `type` (`WorkflowStepType`), `config` (JSON), `createdAt`.

### 3. `WorkflowTrigger`
- **Purpose**: Defines the criteria (e.g., webhook, internal event) that initiates the Workflow.
- **Fields**: `id`, `workflowId`, `eventName`, `conditions` (JSON), `createdAt`.

### 4. `WorkflowExecution`
- **Purpose**: Tracks the runtime history of a specific Workflow instance.
- **Fields**: `id`, `companyId`, `workflowId`, `triggerData` (JSON), `status` (`WorkflowExecutionStatus`), `startedAt`, `completedAt`, `errorMessage`, `createdAt`.

## Security & Multi-Company Isolation

- **`companyId` Enforcement**: Every single model that acts as a root aggregate (`Workflow`, `WorkflowExecution`) includes a `companyId` field. 
- **Future Integration Rule**: Any future queries accessing these models must implicitly append `where: { companyId: currentUser.companyId }`.
- **RBAC Constants**: Permissions `WORKFLOW_VIEW`, `WORKFLOW_CREATE`, `WORKFLOW_UPDATE`, `WORKFLOW_DELETE`, and `WORKFLOW_EXECUTE` have been added to the default platform permissions map, ensuring robust gating when UI/APIs are built.

## Future Integration Points

- **Approval Engine (Phase 3)**: Will hook directly into `WorkflowStep` using the `ACTION` or `CONDITION` type, halting execution until an approval is externally provided.
- **Notifications**: `WorkflowStep` with type `NOTIFICATION` will dispatch payloads to the new `NotificationQueue` built in Phase 1.
- **Background Execution**: The engine will utilize the `BackgroundJob` model (from Phase 1) to execute flows asynchronously without blocking the main event loop.

## Risks

- **Execution Blocking**: If the execution engine is implemented synchronously in the future, long-running webhooks or heavy operations within a step could stall the API. (Mitigation: Use Phase 1 `BackgroundJob` model).
- **Migration Impact**: Migrating hardcoded module statuses to dynamic workflows requires complex backward-compatibility mappings to avoid breaking v1.1 UI components.
