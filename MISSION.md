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
  - **Completed**: Engineered `EmployeeLoan` and `SalaryAdvance` modules alongside explicit installment and recovery ledgers. Integrated `issueLoan` and `issueAdvance` to hand off payloads to the Posting Engine. Architected automated payroll recovery workflows. Validated schemas. Awaiting approval for Phase 8.
## Goal Pivots & Architectural Decisions
- **Version 1.3 Dark Release Strategy:** Continuing the successful V1.2 strategy. All new UI elements must be feature-flagged or hidden behind `/v2/` additive routes until tested.
- **Background Worker Shift**: V1.3 pivots heavily toward asynchronous event-driven design (Background Queues) to handle heavy tasks like notifications, report generation, and LLM processing without blocking the API.
- **Additive Extension over Replacement:** Reused existing tables (`Warehouse`, `Supplier`, `PurchaseOrder`) by safely appending nullable fields rather than breaking legacy v1.1 structures.
- **Abstract Service Hook:** Instead of embedding Prisma inserts into every Payroll/Inventory API, we created a single `lib/notifications/notificationService.ts` that safely checks user opt-in preferences before generating rows.
- **Double-Entry Stock Ledger:** We explicitly rejected adding a scalar `currentStock` integer to the Product table. Instead, stock is calculated dynamically from the `StockTransaction` ledger to prevent data drift and race conditions.
- **Zero RBAC/Company Breach:** Adhered strictly to `VIEW_PRODUCTS`, `MANAGE_STOCK`, `VIEW_ASSETS`, `MANAGE_ASSETS` and isolated every query by `{ where: { companyId } }`.
- **Core Goal:** Build the definitive B2B SaaS ERP with strict accounting, inventory, supply chain, and comprehensive HR & Payroll controls.
- **Current Status:** Version 1.4 (Enterprise Procurement & Supplier Management) is officially Frozen. Currently in Version 1.5 Phase 7 (Enterprise Loan & Advance Management).

## Production Roadmap
1. **Version 1.3 Phase 1 (Core Engines):** Deploy background workers for Notifications, Approvals, and Webhook dispatching.
2. **Version 1.3 Phase 2 (Enterprise Inventory):** Complete multi-branch stock management, stock transfers, and purchase order lifecycles.
3. **Version 1.3 Phase 3 (CRM 2.0 & Accounting):** Build Sales Pipeline, Quotations, and a fully integrated double-entry General Ledger.
4. **Version 1.4 (Enterprise Procurement):** RFQ, Vendor Comparison, Purchase Orders, GRN, and Three-Way Match accounting.
5. **Version 1.5 (Enterprise HR & Payroll):** Organization structure, Time & Attendance tracking, Leave requests, and asynchronous Payroll generation.
6. **Future (AI & SaaS Administration):** LLM-powered analytics over ERP data and Tenant billing setup.
