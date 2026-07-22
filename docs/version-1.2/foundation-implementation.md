# Version 1.2 Foundation Implementation

## Created Models

### 1. `AuditEvent`
- **Purpose**: Centralized and standardized activity tracking across all modules in the platform, allowing us to eventually replace disjointed logs (e.g., `PayrollAudit`, `ReportAudit`).
- **Fields**: `id`, `companyId`, `userId`, `action` (using `AuditAction` enum), `entity`, `entityId`, `metadata` (JSON), `createdAt`.

### 2. `ModulePermission`
- **Purpose**: A junction table that robustly connects `Module` with `Permission`, ensuring that permissions can be dynamically restricted based on module licensing.
- **Fields**: `id`, `moduleId`, `permissionId`.

### 3. `BackgroundJob`
- **Purpose**: To provide a database-backed queuing system for future automation, such as the Workflow and Approval engines, as well as Notification dispatch.
- **Fields**: `id`, `companyId`, `type`, `status` (using `JobStatus` enum), `payload` (JSON), `startedAt`, `completedAt`, `createdAt`.

## Updated Existing Models

### 1. `Notification`
- **Updates**: Added `type` using the new `NotificationType` enum, and a boolean `read` field (defaulting to `false`). This bridges the gap between old-style and new-style notification configurations.

## New Enums

- **`AuditAction`**: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `APPROVAL`, `EXPORT`
- **`NotificationType`**: `SYSTEM`, `TASK`, `APPROVAL`, `PAYROLL`, `SECURITY`
- **`JobStatus`**: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`

## Relations Added
- **`User`**: Now has a one-to-many relationship with `AuditEvent`.
- **`Company`**: Now has one-to-many relationships with `AuditEvent` and `BackgroundJob`.
- **`Module`** & **`Permission`**: Connected via the `ModulePermission` many-to-many junction model.

## Indexes Added
- **`AuditEvent`**: Indexed by `companyId`, `userId`, and `createdAt` for rapid lookup and time-based filtering.
- **`BackgroundJob`**: Indexed by `companyId` and `createdAt`.

## Future Usage
- `AuditEvent` will absorb all specific module auditing, simplifying compliance reporting.
- `BackgroundJob` will be used heavily in Phase 2+ to execute `Workflow` actions and `NotificationQueue` dispatches asynchronously to avoid blocking API threads.
- `ModulePermission` provides granular checks when constructing the dynamic frontend navigation for different tenant tiers.

## Migration Notes
- **Backward Compatibility**: `Notification.type` is set as an optional nullable field (`NotificationType?`), meaning existing rows without a type will not break any queries. `Notification.read` provides a default `false`.
- **Additive Only**: The schema changes introduce new tables without touching existing data types or required fields.

## Risk Analysis
- **Low Risk**: Because these changes are strictly additive and optional on existing models, there is virtually zero risk of breaking existing API functionality or the Android Application.
- **Validation**: Schema has been formally formatted and validated successfully against Prisma's engine.
