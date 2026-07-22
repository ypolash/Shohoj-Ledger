# Version 1.2 Advanced Reporting Engine Foundation

## Architecture

The Advanced Reporting Engine abstracts all data aggregation, formatting, and file generation out of individual modules and into a unified, configurable engine. Rather than writing hardcoded queries for every specific report required by a client, the engine will process generic `ReportTemplate` definitions (which hold data source mappings and configurations) and dynamically generate output via the `ReportExecution` pipeline.

## Models Created

### 1. `ReportTemplate`
- **Purpose**: Defines the structure, data sources, and configuration for a specific report.
- **Fields**: `id`, `companyId`, `name`, `description`, `moduleKey`, `dataSource`, `configuration` (JSON), `isActive`, `createdById`, `createdAt`, `updatedAt`.
- **Relations**: `Company`, `User` (creator).

### 2. `ReportPermission`
- **Purpose**: Provides highly granular access control over individual reports, overriding or extending global RBAC for specific sensitive datasets.
- **Fields**: `id`, `reportId`, `roleId`, `permissionType`.
- **Relations**: `ReportTemplate`, `Role`.

### 3. `ReportExecution`
- **Purpose**: Represents an asynchronous request to generate a report, storing the output URL once completed.
- **Fields**: `id`, `companyId`, `reportId`, `requestedById`, `format` (PDF/EXCEL/CSV), `status`, `fileUrl`, `parameters` (JSON), `createdAt`, `completedAt`.
- **Relations**: `Company`, `User` (requester), `ReportTemplate`.

### 4. `ScheduledReport`
- **Purpose**: Allows reports to be generated automatically based on a cron schedule and emailed/delivered to configured recipients.
- **Fields**: `id`, `companyId`, `reportId`, `schedule`, `recipients` (JSON), `isActive`, `lastRunAt`, `nextRunAt`, `createdAt`.
- **Relations**: `Company`, `ReportTemplate`.

## Security & Multi-Company Isolation

- **Tenant Enforcement**: Every operational model (`ReportTemplate`, `ReportExecution`, `ScheduledReport`) natively requires a `companyId` mapped to `Company`. No cross-tenant execution is possible at the schema layer.
- **Granular RBAC**: Baseline platform permissions added: `REPORT_VIEW`, `REPORT_CREATE`, `REPORT_UPDATE`, `REPORT_DELETE`, `REPORT_EXPORT`, `REPORT_MANAGE`.
- **Report-Level ACL**: The `ReportPermission` table allows specific roles to be explicitly granted or denied `VIEW` or `EXPORT` access to a specific report, which is crucial for sensitive financial or HR data.

## Future Integrations

- **Report Builder UI**: Will parse the `dataSource` and `configuration` JSON to provide a drag-and-drop report creator.
- **Background Generation**: `ReportExecutionService` will hook directly into the Phase 1 `BackgroundJob` worker queue, pushing heavy PDF or Excel generation off the main API thread.
- **Notification Hook**: The `ScheduledReport` cron loop will utilize Phase 1's `NotificationQueue` to email or alert users when their scheduled report is ready.

## Risks

- **Data Leakage via Configuration**: If a `ReportTemplate` configuration JSON is improperly sanitized, a malicious user could craft queries accessing raw data outside their intended scope. (Mitigation: Data masking and strict column-level validation will be built into the future execution parser).
- **Execution Overload**: Heavy queries running synchronously will crash the server. (Mitigation: Fully offload all `ReportExecution` to background workers).
