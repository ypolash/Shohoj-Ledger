# Version 1.2 API Platform & Webhook System Foundation

## Architecture

The API Platform establishes the foundation for third-party integrations (e.g., custom ERP integrations, partner syncing). It allows Shohoj Ledger to securely expose specific functionalities via standard REST APIs secured by generated API Keys, while also pushing real-time event updates to external URLs via Webhooks.

## Models Created

### 1. `ApiKey`
- **Purpose**: Issues long-lived or short-lived credentials for external machine-to-machine integrations.
- **Fields**: `id`, `companyId`, `name`, `keyHash`, `secretHash`, `permissions`, `expiresAt`, `lastUsedAt`, `isActive`, `createdById`, `createdAt`.
- **Relations**: `Company`, `User` (creator).

### 2. `Webhook`
- **Purpose**: Allows a company to register a destination URL to receive HTTP POST payloads when specific events occur in the system.
- **Fields**: `id`, `companyId`, `name`, `url`, `eventKey`, `secret`, `isActive`, `createdById`, `createdAt`.
- **Relations**: `Company`, `User` (creator), `WebhookDelivery`.

### 3. `WebhookDelivery`
- **Purpose**: An immutable audit log of every outbound webhook attempt, capturing the exact payload sent and the exact HTTP response code received.
- **Fields**: `id`, `companyId`, `webhookId`, `eventKey`, `payload`, `status` (PENDING/SENT/FAILED/RETRYING), `responseCode`, `responseBody`, `attempts`, `createdAt`, `completedAt`.
- **Relations**: `Company`, `Webhook`.

## Security & Multi-Company Isolation

- **Tenant Isolation**: `companyId` is heavily enforced across all three models. API key resolution immediately ties the session context to the owner's `companyId`.
- **Secret Hashing**: API keys will be split into a public ID (`keyHash`) and a strictly hashed secret (`secretHash`), ensuring raw secrets are never retrievable from the database (similarly to standard OAuth implementations).
- **Webhook Security**: Webhook payloads will be signed using HMAC signatures derived from the `Webhook.secret` field, allowing consuming applications to verify the payload originated authentically from Shohoj Ledger.
- **Permissions**: Scoped RBAC constants (`API_KEY_VIEW`, `API_KEY_CREATE`, `API_KEY_DELETE`, `WEBHOOK_VIEW`, `WEBHOOK_CREATE`, `WEBHOOK_MANAGE`) restrict internal platform access.

## Future Integration Plan

- **API Middleware**: A new Edge or standard middleware will be introduced to intercept requests with `x-api-key` headers, resolving the key against the `ApiKey` model, rate-limiting the request, and impersonating the `companyId` context.
- **Event Bus Hooking**: Core services (HR, Payroll, CRM) will dispatch events (e.g., `EMPLOYEE_CREATED`). The `webhookDeliveryService` will intercept these events, find active `Webhook` subscriptions for that `eventKey`, and queue outbound `WebhookDelivery` records.
- **Background Dispatcher**: A queue worker will pick up `PENDING` webhook deliveries and execute the raw HTTP POST requests, handling exponential backoff for failures.

## Risks

- **Webhook Spam/Flooding**: If a customer registers a webhook for a high-frequency event and their server goes down, Shohoj Ledger could face outbound connection exhaustion or massive DB bloat. (Mitigation: Implement aggressive exponential backoff, auto-disable webhooks after X sequential failures, and strict rate limits).
- **Raw Payload Storage**: Storing full JSON payloads in `WebhookDelivery.payload` could cause rapid database expansion. (Mitigation: Implement a cron job to prune `WebhookDelivery` records older than 30 days).
