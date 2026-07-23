# Version 1.3 Phase Breakdown

## Phase 1: Core Engines & Background Workers
**Objectives:** Activate the dormant V1.2 schema models (Notifications, Approvals, Webhooks) into functioning systems by deploying background worker processes.
**Dependencies:** Infrastructure (Node.js worker container or Cron triggers).
**Estimated Complexity:** High (Infrastructure & DevOps).
**Expected Deliverables:** 
- Functional Email/SMS/Push dispatch system draining the `NotificationQueue`.
- Webhook dispatcher handling the `WebhookDelivery` log.
- Notification Center UI for user preferences.
**Risks:** Background job failure handling, VPS memory limits during queue processing.

## Phase 2: Enterprise Inventory & Branch Operations
**Objectives:** Deliver the UI and API business logic for multi-branch stock management, warehouse transfers, and purchase order lifecycles.
**Dependencies:** Phase 1 (Requires Approval Engine for Purchase Orders).
**Estimated Complexity:** High (Business Logic & Concurrency).
**Expected Deliverables:** 
- Advanced Stock Dashboard.
- Barcode Scanner UI integration.
- Multi-Branch data scoping middleware.
**Risks:** Data races in stock calculations if the strict double-entry `StockTransaction` paradigm is bypassed.

## Phase 3: CRM 2.0 & Enterprise Accounting
**Objectives:** Expand the `Lead` model into a full sales pipeline with quotations, and build a GAAP-compliant double-entry General Ledger aggregating all ERP transactions.
**Dependencies:** Phase 2 (Requires product catalog pricing for Quotations).
**Estimated Complexity:** Very High (Financial Math).
**Expected Deliverables:** 
- Quotation & Invoice Builder.
- General Ledger Dashboard, Trial Balance, Cash Flow statements.
**Risks:** Accounting imbalances if developers write manual `prisma.update` calls bypassing the central Ledger API service.

## Phase 4: HR 2.0 & Mobile Ecosystem
**Objectives:** Enhance employee lifecycle management (Shifts, Leave Calendars) and deeply integrate Mobile App 2.0 with the Notification and Approval centers.
**Dependencies:** Phase 1 (Requires Push Notifications).
**Estimated Complexity:** Medium.
**Expected Deliverables:** 
- Employee Self-Service (ESS) Portal upgrades.
- V2 Mobile App release with Actionable Push Notifications (Approve/Reject).
**Risks:** Breaking backward compatibility for users on older Mobile App versions.

## Phase 5: AI Insights & SaaS Administration
**Objectives:** Enable LLM-powered analytics over ERP data and build out the super-admin billing and tenant management portal.
**Dependencies:** All previous data modules (AI needs data to analyze).
**Estimated Complexity:** Medium.
**Expected Deliverables:** 
- AI Chat / Smart Search Interface.
- SaaS Tenant Billing & License management UI.
**Risks:** LLM hallucination on strict financial data; must constrain AI to read-only `AnalyticsSnapshot` data.
