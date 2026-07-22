# Database Design Planning (Version 1.2)

> **NOTE:** This document is for planning purposes only. No schema changes have been implemented yet.

## A. Workflow Automation Engine
- **`Workflow`**: Defines a business process. Fields: `id`, `companyId`, `name`, `module`, `isActive`. (Requires tenant isolation)
- **`WorkflowStep`**: Defines individual steps in a workflow. Fields: `id`, `workflowId`, `stepOrder`, `actionType`.
- **`Trigger`**: What initiates the workflow. Fields: `id`, `workflowId`, `eventType`, `conditions`.
- **`Condition`**: Rules for transition. Fields: `id`, `stepId`, `field`, `operator`, `value`.
- **`Action`**: The outcome executed by a step. Fields: `id`, `stepId`, `actionType`, `payload`.
- **`ExecutionHistory`**: Logs workflow executions. Fields: `id`, `workflowId`, `entityId`, `status`, `startedAt`, `completedAt`.

## B. Approval Engine
- **`ApprovalFlow`**: Template for approval processes. Fields: `id`, `companyId`, `name`, `module`. (Requires tenant isolation)
- **`ApprovalStep`**: Sequential steps in flow. Fields: `id`, `flowId`, `stepOrder`, `approverRoleId`, `approverUserId`.
- **`ApprovalRequest`**: Specific instance of approval. Fields: `id`, `companyId`, `entityType`, `entityId`, `status`, `requestedBy`.
- **`ApprovalHistory`**: Log of approvals/rejections. Fields: `id`, `requestId`, `stepId`, `approverId`, `action`, `comments`.

## C. Advanced Reporting
- **`ReportTemplate`**: Saved report definitions. Fields: `id`, `companyId`, `name`, `module`, `queryConfig`, `visualConfig`. (Requires tenant isolation)
- **`ReportFilter`**: Saved filters for reports. Fields: `id`, `templateId`, `filterLogic`.
- **`ReportPermission`**: Access control for reports. Fields: `id`, `templateId`, `roleId`, `userId`.

## D. Notification Center 2.0
- *Extending existing models (`NotificationTemplate`, `NotificationPreference`)*
- **`NotificationQueue`**: For asynchronous dispatch. Fields: `id`, `companyId`, `recipientId`, `channel`, `payload`, `status`, `scheduledFor`.

## E. API Platform
- **`ApiKey`**: To authenticate external access. Fields: `id`, `companyId`, `keyHash`, `name`, `expiresAt`, `isActive`. (Requires tenant isolation)
- **`ApiPermission`**: Scopes allowed for the API key. Fields: `id`, `apiKeyId`, `resource`, `action`.
- **`Webhook`**: Configured webhook endpoints. Fields: `id`, `companyId`, `url`, `secret`, `isActive`.
- **`WebhookEvent`**: Subscribed events. Fields: `id`, `webhookId`, `eventType`.

## F. Multi Branch
- **`Branch`**: Physical or logical division of a company. Fields: `id`, `companyId`, `name`, `location`, `isActive`. (Requires tenant isolation)
- **`BranchUser`**: Mapping users to branches. Fields: `id`, `branchId`, `userId`, `isDefault`.
- **`BranchPermission`**: Granular branch-level access control. Fields: `id`, `branchId`, `roleId`, `permissionId`.

## G. Advanced Inventory
- *Extending existing `Warehouse`, `Supplier`, `PurchaseOrder`, `StockTransaction`.*
- **`StockTransfer`**: Moving stock between warehouses/branches. Fields: `id`, `companyId`, `fromWarehouseId`, `toWarehouseId`, `status`, `shippedAt`, `receivedAt`.

## H. AI Intelligence
- **`Analytics`**: Pre-aggregated metrics. Fields: `id`, `companyId`, `metricType`, `period`, `value`.
- **`Insights`**: AI-generated findings. Fields: `id`, `companyId`, `module`, `insightText`, `confidence`, `isActionable`.
- **`Prediction`**: Forecasting data. Fields: `id`, `companyId`, `targetMetric`, `forecastValue`, `targetDate`.
