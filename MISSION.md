# MISSION.md

## Core Goal
To build a scalable, secure, and intuitive Enterprise Resource Planning (ERP) application focused on accounting, finance, inventory, and HR management (Shohoj Ledger).

## Current Status
- **Version 1.3 — Phase 0 (Roadmap & Architecture Planning):**
  - **Version 1.2 Complete**: Applied architecture models for Workflow Engine, Approval Engine, Advanced Reporting, Notification Center, API Platform, Multi-Branch, Advanced Inventory, and AI Analytics safely.
  - **V1.3 Planning Complete**: Created documentation for V1.3 in `docs/version-1.3/` spanning the 8 Enterprise Pillars.
- **Version 1.3 — Phase 3A (Enterprise Customer Master):**
  - **Completed**: Added core Customer, CustomerGroup, CustomerAddress, and CustomerContact models. Created `customerService.ts` for operations with full auditability, integrated RBAC, and maintained single source of truth for Sales/CRM.
- **Version 1.3 — Phase 3B (Enterprise Lead Management):**
  - **Completed**: Engineered architectural models for `Lead`, `LeadSource`, and `LeadActivity` incorporating V1.3 enums (LeadStatus, LeadPriority, LeadRating) without breaking V1.2 legacy strings. Built `leadService.ts` for lifecycle management, qualification, and Customer conversion with complete audit logging via `logAudit`. Waitng for approval for Phase 3C Opportunity Pipeline.
- **Version 1.3 — Phase 3C (Enterprise Opportunity Pipeline):**
  - **Completed**: Created `Opportunity`, `OpportunityStage`, and `OpportunityActivity` models with strict enum tracking and probability mappings. Developed `opportunityService.ts` to manage pipeline transitions securely.
- **Version 1.3 — Phase 3D (Enterprise Quotation Engine):**
  - **Completed**: Engineered `Quotation` and `QuotationLine` models alongside `quotationService.ts`. Implemented robust header/line pricing, taxing, and discounting calculations with a comprehensive state machine (`DRAFT` to `ACCEPTED`).
- **Version 1.3 — Phase 3E (Enterprise Sales Order Engine):**
  - **Completed**: Created `SalesOrder` and `SalesOrderLine` models to manage the confirmed customer commitment. Built `salesOrderService.ts` to handle complex pricing mirroring Quotations, and implemented strict logic to reserve inventory (`reservedQuantity`) without executing physical stock deductions or accounting ledgers.
- **Version 1.3 — Phase 3F (Enterprise Delivery Order Workflow):**
  - **Completed**: Created `DeliveryOrder` and `DeliveryOrderLine` models and `deliveryOrderService.ts`. Implemented the `shipDelivery()` workflow which transactionally releases reservations, creates `StockMovement` records, deductions physical inventory, and consumes FIFO `InventoryValuationLayer`s. Ready for Phase 3G Customer Returns (RMA).

## Goal Pivots & Architectural Decisions
- **Version 1.3 Dark Release Strategy:** Continuing the successful V1.2 strategy. All new UI elements must be feature-flagged or hidden behind `/v2/` additive routes until tested.
- **Background Worker Shift**: V1.3 pivots heavily toward asynchronous event-driven design (Background Queues) to handle heavy tasks like notifications, report generation, and LLM processing without blocking the API.
- **Additive Extension over Replacement:** Reused existing tables (`Warehouse`, `Supplier`, `PurchaseOrder`) by safely appending nullable fields rather than breaking legacy v1.1 structures.
- **Abstract Service Hook:** Instead of embedding Prisma inserts into every Payroll/Inventory API, we created a single `lib/notifications/notificationService.ts` that safely checks user opt-in preferences before generating rows.
- **Double-Entry Stock Ledger:** We explicitly rejected adding a scalar `currentStock` integer to the Product table. Instead, stock is calculated dynamically from the `StockTransaction` ledger to prevent data drift and race conditions.
- **Zero RBAC/Company Breach:** Adhered strictly to `VIEW_PRODUCTS`, `MANAGE_STOCK`, `VIEW_ASSETS`, `MANAGE_ASSETS` and isolated every query by `{ where: { companyId } }`.
- Decoupled employment history into a robust `EmployeeLifecycle` timeline event model for better auditability and historical tracking instead of directly mutating all fields without record.
- Added explicit schema models `PayrollAudit` and enhanced `SalaryPayment` fields to rigidly enforce audit logging, allowing robust tracking of approvals and workflow changes while isolating companies via `companyId`.

## Production Roadmap
1. **Version 1.3 Phase 1 (Core Engines):** Deploy background workers for Notifications, Approvals, and Webhook dispatching.
2. **Version 1.3 Phase 2 (Enterprise Inventory):** Complete multi-branch stock management, stock transfers, and purchase order lifecycles.
3. **Version 1.3 Phase 3 (CRM 2.0 & Accounting):** Build Sales Pipeline, Quotations, and a fully integrated double-entry General Ledger.
4. **Version 1.3 Phase 4 (HR 2.0 & Mobile 2.0):** Advanced leave calendars, shift planning, and push notifications to the mobile app.
5. **Version 1.3 Phase 5 (AI & SaaS Administration):** LLM-powered analytics over ERP data and Tenant billing setup.
