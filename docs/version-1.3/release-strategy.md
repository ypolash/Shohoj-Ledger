# Version 1.3 Release Strategy

## 1. Additive Database Principle
Following the success of Version 1.2, all database schema changes required for V1.3 MUST be additive.
- Do NOT rename columns.
- Do NOT delete tables.
- Do NOT add required columns without default values.
This ensures zero downtime during migrations and prevents breaking the live V1.1/V1.2 mobile clients.

## 2. Dark Release UI
- Build new V1.3 screens (e.g., Enterprise Ledger, CRM Pipeline) as hidden routes initially (`/dashboard/v2/ledger`).
- Do NOT alter the existing `/dashboard` navigation until the module is fully tested and approved.
- Expose the new modules using the `CompanySetting` feature flags, allowing beta rollout to specific tenants.

## 3. Graceful Background Degradation
- If the new Background Worker processing the `NotificationQueue` fails or is under high load, the core ERP APIs (e.g., creating a Leave Request) MUST NOT fail.
- All webhook dispatching, email sending, and analytics generation must be strictly asynchronous.

## 4. API Versioning
- V1.3 Mobile APIs must be placed in a separate namespace (e.g., `/api/v2/mobile/`) to ensure the legacy Android app functions flawlessly during the transition period.
