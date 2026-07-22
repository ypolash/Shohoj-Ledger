# Migration Strategy (Version 1.2)

> **NOTE:** No migrations have been created. This is a documentation strategy only.

## 1. Schema Migration Strategy
- **Additive Changes First**: Add new tables (`Workflow`, `ApprovalFlow`, `Branch`) without modifying existing logic.
- **Optional Fields**: Make new relational fields (e.g., `branchId` on existing models) optional initially to avoid breaking current inserts.

## 2. Data Backfill
- **Multi Branch**: For existing companies, create a default "Main Branch" and assign all existing records (Users, Employees, Warehouses) to this default branch via background scripts.
- **Approval Engine**: Convert existing pending statuses (e.g., Leave Requests) into the new `ApprovalRequest` system using a one-time script, mapping them to default approval flows.

## 3. Code Migration Strategy
- **Parallel Run**: Implement new APIs (e.g., `v1.2/leaves`) while keeping legacy APIs intact until frontends migrate.
- **Feature Flags**: Use the existing `FeatureFlag` model to gradually roll out Multi Branch and Workflow engines to select companies first.

## 4. Android Compatibility
- Ensure all new API responses are strictly backward compatible.
- Expose feature flag endpoints to the Android app so it can dynamically disable UI elements for v1.2 features if not yet supported by the client version.
