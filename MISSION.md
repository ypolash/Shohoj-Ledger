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
  - **Completed**: Created `DeliveryOrder` and `DeliveryOrderLine` models and `deliveryOrderService.ts`. Implemented the `shipDelivery()` workflow which transactionally releases reservations, creates `StockMovement` records, deductions physical inventory, and consumes FIFO `InventoryValuationLayer`s.
- **Version 1.3 — Phase 3G (Enterprise Customer Returns - RMA):**
  - **Completed**: Created `CustomerReturn` and `CustomerReturnLine` models, linking back to Delivery Orders. Built `customerReturnService.ts` to support inspection workflows, physical restocking with FIFO restoration, and scrapped write-offs.
- **Version 1.3 — Phase 3H (Enterprise Customer Credit Management):**
  - **Completed**: Created `CustomerCreditProfile` and `CustomerCreditHistory` models. Built `customerCreditService.ts` to enforce credit limits, calculate available credit, automatically evaluate risk levels, and manage manual credit holds.
- **Version 1.3 — Phase 3I (Enterprise Customer Payments & Collections):**
  - **Completed**: Created `CustomerPayment` and `CustomerPaymentAllocation` models. Built `customerPaymentService.ts` to manage cash/bank receipts, partial allocations, unallocated advance balances, and integration with credit limits.
- **Version 1.3 — Phase 3J (Enterprise Sales Commission Engine):**
  - **Completed**: Created `CommissionPolicy` and `SalesCommission` models. Built `commissionService.ts` to handle math evaluation, recalculation, and approval loops, effectively bridging CRM transactions with future Payroll capabilities.
- **Version 1.3 — Phase 3K (Enterprise Customer Portal Services):**
  - **Completed**: Extended `Customer` model with portal credentials. Built `customerPortalService.ts` providing secure, isolated backend APIs for external clients to view orders, payments, statements, and manage their profiles.
- **Version 1.3 — Phase 3L (Enterprise CRM Analytics Engine):**
  - **Completed**: Created `crmAnalyticsService.ts` to aggregate cross-module metrics securely. Implemented robust dashboards for executives, sales, customers, leads, and financials. Prepared foundational JSON structures for future BI, caching, and AI injection.
- **Version 1.3 — Phase 3M (Final CRM Architecture Review):**
  - **Completed**: Performed a thorough architectural review of the entire Phase 3 module. Architecture is fully approved and **FROZEN**.

## Production Roadmap (Version 1.4)
- **Version 1.4 — Phase 1 (Enterprise Supplier Master):**
  - **Completed**: Implemented comprehensive `Supplier` models including categories, addresses, contacts, bank accounts, and documents. Built `supplierService.ts` to manage vendor lifecycle, statuses, and strict companyId isolation.
- **Version 1.4 — Phase 2 (Enterprise Purchase Requisition):**
  - **Completed**: Fully replaced legacy `PurchaseRequest` models with `PurchaseRequisition` and `PurchaseRequisitionLine`. Built robust status workflow, approval tracking, and integration scaffolding for future budget controls and RFQ routing.
- **Version 1.4 — Phase 3 (Request for Quotation - RFQ):**
  - **Not Started**: Implement competitive vendor bidding engine based on approved Requisitions.

## Goal Pivots & Architectural Decisions
- **Version 1.3 Dark Release Strategy:** Continuing the successful V1.2 strategy. All new UI elements must be feature-flagged or hidden behind `/v2/` additive routes until tested.
- **Background Worker Shift**: V1.3 pivots heavily toward asynchronous event-driven design (Background Queues) to handle heavy tasks like notifications, report generation, and LLM processing without blocking the API.
- **Additive Extension over Replacement:** Reused existing tables (`Warehouse`, `Supplier`, `PurchaseOrder`) by safely appending nullable fields rather than breaking legacy v1.1 structures.
- **Abstract Service Hook:** Instead of embedding Prisma inserts into every Payroll/Inventory API, we created a single `lib/notifications/notificationService.ts` that safely checks user opt-in preferences before generating rows.
- **Double-Entry Stock Ledger:** We explicitly rejected adding a scalar `currentStock` integer to the Product table. Instead, stock is calculated dynamically from the `StockTransaction` ledger to prevent data drift and race conditions.
- **Zero RBAC/Company Breach:** Adhered strictly to `VIEW_PRODUCTS`, `MANAGE_STOCK`, `VIEW_ASSETS`, `MANAGE_ASSETS` and isolated every query by `{ where: { companyId } }`.
- **Core Goal:** Build the definitive B2B SaaS ERP with strict accounting, inventory, and supply chain controls.
- **Current Status:** Version 1.3 ERP Architecture (Accounting, Inventory 2.0, CRM & Sales) is 100% complete and frozen (Git Tag: `v1.3.0`). Preparing for Version 1.4 (Enterprise Procurement & Supplier Management).

## Production Roadmap
1. **Version 1.3 Phase 1 (Core Engines):** Deploy background workers for Notifications, Approvals, and Webhook dispatching.
2. **Version 1.3 Phase 2 (Enterprise Inventory):** Complete multi-branch stock management, stock transfers, and purchase order lifecycles.
3. **Version 1.3 Phase 3 (CRM 2.0 & Accounting):** Build Sales Pipeline, Quotations, and a fully integrated double-entry General Ledger.
4. **Version 1.3 Phase 4 (HR 2.0 & Mobile 2.0):** Advanced leave calendars, shift planning, and push notifications to the mobile app.
5. **Version 1.3 Phase 5 (AI & SaaS Administration):** LLM-powered analytics over ERP data and Tenant billing setup.
