# Enterprise Lead Management (Version 1.3 Phase 3B)

## Overview
The Enterprise Lead Management module manages the lifecycle of potential customers before they become official `Customer` entries. It acts as the CRM funnel input, capturing lead sources, tracking progress through qualification, and transitioning leads into opportunities (Phase 3C) and customer accounts.

## Architecture
- **Additive Extension:** Built as a pure extension in `Version 1.3`. It coexists with legacy structures.
- **Database Models:**
  - `LeadSource`: Master table for categorizing lead origins (e.g., Website, Referral, Conference).
  - `Lead`: The primary entity tracking prospect details, estimated values, and conversion lifecycle. Legacy fields (like `serialNumber`, `client`, `serviceType`) are retained for backwards compatibility, while V1.3 fields (`leadNumber`, `estimatedValue`, Enums) are introduced.
  - `LeadActivity`: An audit trail for every interaction (calls, meetings, status changes, assignments).
- **Service Layer:** `lib/crm/leadService.ts` encapsulates all business logic, preventing direct Prisma calls in controllers.

## Lead Lifecycle & Qualification Process
1. **Creation (NEW):** Lead is entered into the system manually or via API integrations. A unique `leadNumber` is auto-generated.
2. **Engagement (CONTACTED):** Sales representatives communicate with the prospect. Interactions are logged as `LeadActivity`.
3. **Qualification (QUALIFIED):** The prospect meets criteria for budget, authority, need, and timeline (BANT).
4. **Disqualification (UNQUALIFIED):** The lead is deemed not viable.
5. **Loss (LOST):** The prospect chose another vendor or explicitly declined. A `lostReason` is recorded.
6. **Conversion (CONVERTED):** The lead agrees to move forward. They are transitioned to an official `Customer` (Customer Master), and in Phase 3C, an `Opportunity` will be created.

## Conversion Process
- When converting, the lead's status is changed to `CONVERTED`.
- A linkage to `Customer` (`customerId`) is established in the Lead record, ensuring a continuous paper trail.
- No new `Accounting`, `Inventory`, `Warehouse`, or `Posting Engine` changes occur during lead conversion. The system safely transitions the entity purely within the CRM/Sales domain.

## Activities & Audit
- **LeadActivity:** Explicitly tracks CRM events (e.g., ASSIGNED, STATUS_CHANGE, CONVERTED).
- **Global Audit Log:** The standard `logAudit` function intercepts CREATE/UPDATE/DELETE events, ensuring compliance and robust tracking.

## Security & RBAC
- **Multi-tenant Isolation:** Every Lead operation in `leadService.ts` strictly filters by `companyId`.
- **Permissions Required (to be seeded/implemented in UI layers):**
  - `LEAD_VIEW`
  - `LEAD_CREATE`
  - `LEAD_UPDATE`
  - `LEAD_DELETE`
  - `LEAD_ASSIGN`
  - `LEAD_CONVERT`

## Future Integration (Phase 3C)
- **Opportunity Pipeline:** Converted leads will automatically spawn `Opportunity` records.
- **Quotations:** Opportunities will seamlessly generate `Quotation` documents.
- **Sales Orders:** Quotations convert into Sales Orders, finally touching Inventory and Accounting.
