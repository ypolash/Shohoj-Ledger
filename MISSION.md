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
  - **Completed**: Engineered `RequestForQuotation` and `VendorQuotation` pipelines. Built `rfqService.ts` and `vendorQuotationService.ts` to manage bidding lifecycles securely.
- **Version 1.4 — Phase 4 (Enterprise Vendor Comparison & Approval):**
  - **Completed**: Developed algorithmic `VendorComparison` engine supporting `LOWEST_PRICE`, `WEIGHTED_SCORE`, and `MANUAL_SELECTION`. Integrated matrix selection with strict managerial approval locks.
- **Version 1.4 — Phase 5 (Enterprise Purchase Order Engine):**
  - **Completed**: Repurposed legacy PO models into the Enterprise V1.4 architecture. Engineered `purchaseOrderService.ts` to generate POs algorithmically from Vendor Comparisons. Implemented strict barriers preventing premature Inventory and Ledger mutations.
- **Version 1.4 — Phase 6 (Goods Receipt Note - GRN):**
  - **Completed**: Fully implemented the `GoodsReceiptNote` and `GoodsReceiptLine` models. Engineered `goodsReceiptService.ts` to seamlessly integrate external supplier commitments (POs) with internal stock movements and FIFO valuation, enforcing strict isolation against the accounting ledger.
- **Version 1.4 — Phase 7 (Supplier Invoice & Three-Way Matching):**
  - **Completed**: Engineered `SupplierInvoice` and `ThreeWayMatch` models. Built `supplierInvoiceService.ts` and `threeWayMatchService.ts` to implement rigorous variance tolerance loops. Hooked the final, approved invoice directly into the core `PostingService` to recognize Accounts Payable liabilities transactionally.
- **Version 1.4 — Phase 8 (Supplier Payments):**
  - **Completed**: Engineered `SupplierPayment` and `SupplierPaymentAllocation` models. Created `supplierPaymentService.ts` to manage unallocated funds, partial invoice assignments, and dynamic balance computations, successfully piping payment finalization to the AP General Ledger.
- **Version 1.4 — Phase 9 (Procurement Analytics):**
  - **Completed**: Implemented `procurementAnalyticsService.ts` providing read-only executive KPIs, spend analysis, top supplier aggregations, and procurement cycle tracking. Fully decoupled from transactional mutations.
- **Version 1.4 — Phase 10 (Final Procurement Architecture Review):**
  - **Completed**: Executed a comprehensive architectural audit across all Procurement phases. Confirmed strict data isolation, zero leakages into frozen modules, robust RBAC integrations, and complete end-to-end P2P workflows. Version 1.4 is officially Frozen.
- **Version 1.5 — Phase 0 (Enterprise HR & Payroll Architecture Planning):**
  - **Completed**: Authored `hr-architecture.md` outlining the Hire-to-Retire workflow, modular integration with Accounting/CRM/Procurement, secure RBAC boundaries, and strategies for expanding Time & Attendance without breaking the frozen models. Waiting for user approval to begin Phase 1.
- **Version 1.5 — Phase 1 (Enterprise Organization Structure):**
  - **Completed**: Successfully implemented the Enterprise Organization hierarchy models (`Division`, `Section`, `Team`, etc.) in `schema.prisma`. Engineered `organizationService.ts` for hierarchy operations and created `organization-structure.md`. Validated schemas. 
- **Version 1.5 — Phase 2 (Enterprise Employee Master):**
  - **Completed**: Extended the existing `Employee` module with comprehensive HR records (`EmployeeProfile`, `EmployeeAddress`, etc.) and linked it to the Phase 1 Organization Structure. Created `employeeService.ts` for handling complex transactions with immutable `EmployeeLifecycle` logging. Validated schemas.
- **Version 1.5 — Phase 3 (Enterprise Recruitment & ATS):**
  - **Completed**: Authored complete Applicant Tracking System (`JobOpening`, `Applicant`, `Application`, `Interview`, `JobOffer`). Isolated `Applicant` from `Employee` master. Built `recruitmentService.ts` providing seamless workflow ending in a `hireApplicant` conversion function that defers completely to the core Employee Service. Validated schemas.
- **Version 1.5 — Phase 4 (Enterprise Attendance & Shift Management):**
  - **Completed**: Extended legacy `Attendance` models with `AttendanceShiftAssignment`, `AttendanceException`, `AttendanceAdjustment`, `AttendanceOvertime`, and `AttendanceRoster`. Created `attendanceService.ts` mapping pure mathematical rule evaluations while preserving strict boundaries so no financial deductions happen prior to Payroll processing. Validated schemas.
- **Version 1.5 — Phase 5 (Enterprise Leave Management):**
  - **Completed**: Authored complete Leave Management System (`LeaveType`, `LeavePolicy`, `LeaveBalance`, `LeaveApproval`, `LeaveAccrual`, `LeaveEncashment`). Upgraded legacy `LeaveRequest` with multi-level hierarchical approvals. Built `leaveService.ts` providing seamless workflow ending in read-only consumption for Attendance and Payroll modules. Validated schemas.
- **Version 1.5 — Phase 6 (Enterprise Payroll Engine):**
  - **Completed**: Authored complete immutable Payroll Engine (`SalaryStructure`, `SalaryComponent`, `EmployeeSalary`, `PayrollPeriod`, `PayrollRun`, `PayrollItem`, `PayrollAdjustment`, `PayrollApproval`, `PayrollSnapshot`). Built 6-part service layer bridging Attendance OT, Leave deductions, and legacy Posting Engine (for isolated accounting). Validated schemas.
- **Version 1.5 — Phase 7 (Enterprise Loan & Advance Management):**
  - **Completed**: Engineered `EmployeeLoan` and `SalaryAdvance` modules alongside explicit installment and recovery ledgers. Integrated `issueLoan` and `issueAdvance` to hand off payloads to the Posting Engine. Architected automated payroll recovery workflows. Validated schemas.
- **Version 1.5 — Phase 8 (Enterprise Performance Management):**
  - **Completed**: Authored complete Performance Evaluation Engine (`PerformanceCycle`, `PerformanceGoal`, `PerformanceReview`, `PerformanceScore`, `PerformanceFeedback`, `PerformanceImprovementPlan`). Built robust 360-review workflow logic in `performanceService.ts` independent from Payroll logic, but prepared for future bonus ingestion. Validated schemas.
- **Version 1.5 — Phase 9 (Enterprise Training & Development):**
  - **Completed**: Authored comprehensive Training Engine (`TrainingProgram`, `TrainingSession`, `TrainingEnrollment`, `TrainingAttendance`, `TrainingAssessment`, `TrainingCertificate`). Built strict capacity-validating workflow in `trainingService.ts`, decoupling certification from core Performance logic while preserving historical linkage. Validated schemas.
- **Version 1.5 — Phase 10 (Enterprise HR Analytics):**
  - **Completed**: Authored `hrAnalyticsService.ts` exposing 20 discrete methods for Dashboards, Statistical Analysis, and Financial Summaries. Established strict isolation by querying Prisma directly rather than relying on mutable operational endpoints. Enforced `companyId` data boundaries on all KPI aggregations.
- **Version 1.5 — Phase 11 (Final HR Architecture Review):**
  - **Completed**: Executed complete structural audit of the Hire-to-Retire lifecycle. Verified database relations, transaction safety, accounting isolation, and multi-tenant logic. APPROVED WITH RECOMMENDATIONS. HR Architecture is frozen.
- **Version 1.5 — Soft Architecture Freeze:**
  - **Completed**: The entire HR & Payroll suite (Organization, Employee Master, ATS, Attendance, Leave, Payroll, Loans, Performance, Training, Analytics) is officially under a soft freeze. No schema breaking changes or business workflow redesigns permitted. Future iterations (V1.6+) must reuse these boundaries.
- **Version 1.6 — Sprint 1.1 (Company Onboarding Stabilization):**
  - **Completed & Approved**: Investigated and resolved the critical P2003 foreign key constraint bug in the signup transaction. Refactored `companySetup.ts` to implement `Promise.all` instead of `createMany` for roles, enforced proper sequential execution, and integrated missing `Permission Assignment` and `Owner Membership` steps. Validated the entire flow.
- **Version 1.6 — Sprint 1.2 (Authentication & Dashboard Stabilization):**
  - **Completed & Approved**: Fixed RBAC stripping by properly injecting `roleId` into the session via `getCompanyContext.ts`. Prevented payload role overwrites in the login API. Secured the dashboard `overview/route.ts` against tenant leakage by strictly filtering on `companyId`, and optimized 9 sequential queries into a concurrent `Promise.all` operation. Validated login, RBAC, and dashboard load times.
## Goal Pivots & Architectural Decisions
- **Version 1.3 Dark Release Strategy:** Continuing the successful V1.2 strategy. All new UI elements must be feature-flagged or hidden behind `/v2/` additive routes until tested.
- **Background Worker Shift**: V1.3 pivots heavily toward asynchronous event-driven design (Background Queues) to handle heavy tasks like notifications, report generation, and LLM processing without blocking the API.
- **Additive Extension over Replacement:** Reused existing tables (`Warehouse`, `Supplier`, `PurchaseOrder`) by safely appending nullable fields rather than breaking legacy v1.1 structures.
- **Abstract Service Hook:** Instead of embedding Prisma inserts into every Payroll/Inventory API, we created a single `lib/notifications/notificationService.ts` that safely checks user opt-in preferences before generating rows.
- **Double-Entry Stock Ledger:** We explicitly rejected adding a scalar `currentStock` integer to the Product table. Instead, stock is calculated dynamically from the `StockTransaction` ledger to prevent data drift and race conditions.
- **Zero RBAC/Company Breach:** Adhered strictly to `VIEW_PRODUCTS`, `MANAGE_STOCK`, `VIEW_ASSETS`, `MANAGE_ASSETS` and isolated every query by `{ where: { companyId } }`.
- **Core Goal:** Build the definitive B2B SaaS ERP with strict accounting, inventory, supply chain, and comprehensive HR & Payroll controls.
- **Current Status:** Version 1.4 (Enterprise Procurement & Supplier Management) is officially Frozen. Version 1.5 (Enterprise HR & Payroll) Architecture is officially Frozen.

## Production Roadmap
1. **Version 1.3 Phase 1 (Core Engines):** Deploy background workers for Notifications, Approvals, and Webhook dispatching.
2. **Version 1.3 Phase 2 (Enterprise Inventory):** Complete multi-branch stock management, stock transfers, and purchase order lifecycles.
3. **Version 1.3 Phase 3 (CRM 2.0 & Accounting):** Build Sales Pipeline, Quotations, and a fully integrated double-entry General Ledger.
4. **Version 1.4 (Enterprise Procurement):** RFQ, Vendor Comparison, Purchase Orders, GRN, and Three-Way Match accounting.
5. **Version 1.5 (Enterprise HR & Payroll):** Organization structure, Time & Attendance tracking, Leave requests, and asynchronous Payroll generation.
6. **Future (AI & SaaS Administration):** LLM-powered analytics over ERP data and Tenant billing setup.
- **Version 2.0 — Sprint 2.1 Phase 1 (Customer Master):**
  - **Completed & Approved**: Added missing CRM features: `CustomerTag` (via string array), `CustomerDocument`, `CustomerGroup`, `CustomerContact`, `CustomerAddress`. Implemented API and UI adhering to V1.3 security standards.
- **Version 2.0 — Sprint 2.1 Phase 2 (Opportunity Management):**
  - **Completed & Approved**: Integrated Pipeline support, Activity Attachments, Lost Reason tracking, and Tags into the existing Opportunity architecture without breaking V1.3 isolation rules. Added multi-pipeline management UI, Kanban/Board ready listings, and a dynamic Pipeline Dashboard reflecting Expected Revenue.
- **Version 2.0 — Sprint 2.1 Phase 3 (Quotation Management):**
  - **Completed & Approved**: Built Quotation CRUD logic linking to Customers and Opportunities. Delivered state-machine workflows (Draft -> Pending -> Approved -> Sent -> Accepted).
- **Version 2.0 — Sprint 2.1 Phase 4 (Sales Order Management):**
  - **Completed & Approved**: Finished Enterprise Sales Order module. Integrated `productWarehouseService.reserveStock` to handle mathematically-isolated inventory reservations triggered on approval. Prevented accounting leakage and added JSON serialization for dynamic Remarks.
- **Version 3.0 — Sprint UI-0 (Master Enterprise Design System):**
  - **Completed**: Established the foundation for the Enterprise Design System using pure Vanilla CSS. Created comprehensive `docs/ui-design-system.md` detailing the design language, grid, typography, and dark mode rules. Implemented extensive root CSS variables (tokens) in `app/globals.css` covering colors, spacing, radius, shadow, typography, and z-index to guarantee UI consistency. Architecture, backend, and DB remain fully frozen.
- **Version 3.0 — Sprint UI-0.5 (Enterprise UX Planning & Wireframes):**
  - **Completed**: Froze the complete User Experience (UX) of Shohoj Ledger. Documented application map, sidebar navigation, page inventory, user flows, dashboard structures, responsive layouts, table/form standards, and accessibility guidelines across 10 specialized markdown files. Architecture and backend remain fully frozen.
- **Version 3.0 — Sprint UI-1A (Enterprise Application Shell):**
  - **Completed**: Built the robust responsive AppShell foundation (`Topbar`, `Sidebar`, `PageContainer`). Implemented context-driven state management for layout and theme (Light/Dark). Avoided any backend/DB changes, replaced standard dashboard layout with the scalable UI.
- **Version 3.0 — Sprint UI-1B (Enterprise Component Library):**
  - **Completed**: Built a complete, production-ready, highly reusable Enterprise Component Library using React, TypeScript, and pure Vanilla CSS. Implemented Primitives (Button, Badge, Chip, Avatar, Skeleton), Form Elements (Input, Select, Checkbox, Radio, Switch), Overlays (Modal, Drawer, Dialog, Toast, Alert, Tooltip, Popover), and Data Layouts (Card, Tabs, Accordion, Progress, Pagination, DataGrid). Fully responsive, theme-aware, and accessible. No backend changes.
- **Version 3.0 — Sprint UI-2 (Enterprise Dashboard):**
  - **Completed**: Built the comprehensive, responsive Enterprise Dashboard. Implemented role-aware modular widgets including KPI Cards, Business Charts, Quick Actions, Timeline, Tasks, Notifications, and Calendar. Managed 600-line modularity limit by extracting widgets into `app/dashboard/components`. No backend API or business logic changes.
- **Version 3.0 — Sprint UI-3A (Enterprise Lead Management):**
  - **Completed**: Built the complete Enterprise Lead Management module in `app/dashboard/crm/leads`. Implemented 16 modular UI components (LeadTable, LeadFilters, LeadCard, LeadTimeline, etc.) keeping strictly within the 600-line limit. Reused existing APIs without backend modification. Delivered List, Detail, Create, and Edit pages with responsive layouts and theme support.
- **Version 3.0 — Sprint UI-3B (Enterprise Customer Management):**
  - **Completed**: Built the Enterprise Customer Management module in `app/dashboard/crm/customers`. Created highly detailed UI mapping for the Customer Master profile (Overview, Financials, Timeline, Contacts, Orders, etc.) using 17+ modular components adhering to the 600-line constraint. Delivered List, Create, Edit, and Tabbed Detail views with full responsiveness, leveraging the existing AppShell and Vanilla CSS. No backend modifications.
- **Version 3.0 — Sprint UI-3C (Enterprise Opportunity & Sales Pipeline):**
  - **Completed**: Built the Enterprise Opportunity Management module in `app/dashboard/crm/opportunities`. Implemented interactive Kanban Board, Pipeline Funnel, and Revenue Forecast views. Built 18 modular components keeping strictly within the 600-line limit. Reused existing APIs without backend modification. Delivered List, Detail, Create, and Edit pages with responsive layouts, preserving UI state and theme consistency.
- **Version 3.0 — Sprint UI-3D (Enterprise Quotation & Sales Order):**
  - **Completed**: Built the Quotation Builder and Sales Order modules fulfilling the CRM-to-ERP conversion workflow. Created 30+ modular components strictly adhering to the 600-line constraint. Developed an interactive Builder with dynamic calculation of line items, taxes, and discounts. Built a dedicated professional PDF print layout. Reused existing AppShell, Vanilla CSS, and frozen APIs without modifying the backend.
- **Version 3.0 — Sprint UI-3E (Enterprise CRM Reports, Activities & Calendar):**
  - **Completed**: Completed the CRM module by building the executive Reporting Dashboard, Sales/Pipeline/Performance Analytics, Activity Feed, and Calendar modules. Developed 15+ visually rich, dependency-free CSS-based charts and grid calendars (Funnel, Revenue Trend, Pipeline Doughnut, Win/Loss). Enforced the 600-line modularity rule. Used robust mock data for presentation layer visualization without altering the frozen backend.
