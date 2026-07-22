# Version 1.2 Notification Center 2.0 Foundation

## Architecture

The Notification Center 2.0 replaces the legacy one-off email/in-app implementations with a robust, multi-channel queuing system. Instead of firing an email synchronously when an action occurs (which blocks the API), modules will push events to the `NotificationQueue`. Background workers will then parse user preferences and templates to deliver messages via Email, SMS, WhatsApp, Push, or In-App channels asynchronously.

## Models Created/Replaced

### 1. `NotificationTemplate` (Replaced)
- **Purpose**: Defines dynamic messages mapped to system events (e.g., `LEAVE_REQUESTED`).
- **Fields**: `id`, `companyId`, `name`, `eventKey`, `channel`, `titleTemplate`, `messageTemplate`, `variables`, `isActive`, `createdAt`, `updatedAt`.
- **Relations**: `Company`, `NotificationQueue`.

### 2. `NotificationPreference` (Replaced)
- **Purpose**: Stores individual user opt-ins/opt-outs for specific channels.
- **Fields**: `id`, `companyId`, `userId`, `channel`, `enabled`, `createdAt`, `updatedAt`.
- **Relations**: `Company`, `User`.

### 3. `NotificationQueue`
- **Purpose**: The central staging table for all pending outbound communications.
- **Fields**: `id`, `companyId`, `userId`, `templateId`, `channel`, `payload`, `status` (PENDING/PROCESSING/SENT/FAILED), `scheduledAt`, `sentAt`, `errorMessage`, `createdAt`.
- **Relations**: `Company`, `User`, `NotificationTemplate`, `NotificationDeliveryLog`.

### 4. `NotificationDeliveryLog`
- **Purpose**: Immutable audit log of exact responses from external providers (e.g., Twilio, SendGrid).
- **Fields**: `id`, `companyId`, `notificationId`, `channel`, `status`, `providerResponse`, `deliveredAt`, `createdAt`.
- **Relations**: `Company`, `NotificationQueue`.

## Security & Multi-Company Isolation

- **Tenant Enforcement**: Every notification model inherently enforces `companyId` mapped directly to the `Company` model. Queues cannot mix between companies.
- **Granular RBAC**: The permissions `NOTIFICATION_VIEW`, `NOTIFICATION_CREATE`, `NOTIFICATION_UPDATE`, and `NOTIFICATION_MANAGE` establish boundaries for who can modify templates and oversee queues.

## Event System Preparation

The system is primed for an event-driven architecture. Future event keys that will be mapped in the codebase include:
- `USER_CREATED`, `EMPLOYEE_CREATED`
- `LEAVE_REQUESTED`, `APPROVAL_PENDING`, `APPROVAL_COMPLETED`
- `PAYROLL_PROCESSED`, `PAYMENT_RECEIVED`, `TASK_ASSIGNED`

## Future Integrations

- **External Providers**: The `DeliveryService` will be implemented with adapters for SendGrid (Email), Twilio (SMS/WhatsApp), and Firebase (Push).
- **Workflow & Approval Engines**: Phase 2 and Phase 3 engines will drop payloads directly into the `NotificationQueue` upon state changes without knowing anything about the end-user's channel preferences.
- **Background Execution**: Phase 1's `BackgroundJob` runner will continuously poll `NotificationQueue` for `PENDING` items where `scheduledAt <= NOW()`.

## Risks

- **Queue Bottlenecks**: High volume operations (like Payroll processing for 1000 employees) could flood the queue. (Mitigation: Implement batching in the `DeliveryService` and configure background worker concurrency).
- **Spam/Provider Limits**: Unthrottled events could exhaust SMS quotas. (Mitigation: Add rate-limiting logic per company inside `DeliveryService.processQueue()`).
