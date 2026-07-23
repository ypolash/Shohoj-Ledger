# Enterprise Opportunity Pipeline (Version 1.3 Phase 3C)

## Overview
The Enterprise Opportunity Pipeline tracks potential sales deals that can generate one or more Quotations. It serves as the core funnel management tool, visualizing deal values, tracking win probabilities across stages, and securely driving prospects towards becoming revenue-generating Sales Orders.

## Architecture
- **Additive Extension:** Built as an explicit extension in `Version 1.3`. It links seamlessly to existing `Customer`, `Employee`, and `Lead` models.
- **Database Models:**
  - `OpportunityStage`: Master configurable table defining the pipeline stages (e.g., Prospecting, Qualification, Proposal). Configures default win probabilities.
  - `Opportunity`: The primary transactional entity tracking the deal's title, estimated revenue, expected close date, probability, and current stage. Links optionally to a `Lead` (if originated there) and mandatorily to a `Customer`.
  - `OpportunityActivity`: Tracks every touchpoint, status change, and probability update for absolute deal visibility.
- **Service Layer:** `lib/crm/opportunityService.ts` encapsulates pipeline logic, preventing direct Prisma calls in controllers and enforcing validation.

## Pipeline Lifecycle & Stage Management
1. **Creation:** An opportunity is created with an `OPEN` status. It is assigned to a specific `OpportunityStage` and inherits that stage's `winProbability` (or it can be manually overridden).
2. **Stage Progression:** As the deal progresses (e.g., Prospecting → Needs Analysis → Negotiation), calling `moveStage()` automatically maps the deal to the new stage's default probability.
3. **Probability Model:** Probability (0-100%) acts as a forecasting multiplier against `estimatedRevenue`.
4. **Resolution:**
   - `markWon()`: Forces probability to 100% and status to `WON`.
   - `markLost()`: Forces probability to 0%, sets status to `LOST`, and records the reason.
   - `CANCELLED`: Deal is aborted without being lost to a competitor.

## Activities & Audit
- **OpportunityActivity:** Tracks explicit manual entries and automated system state transitions (like stage changes).
- **Global Audit Log:** The standard `logAudit` function hooks into CREATE, UPDATE, and DELETE actions, ensuring a secure paper trail of pipeline tampering or adjustments.

## Security & RBAC
- **Multi-tenant Isolation:** Every interaction strictly requires and filters on `companyId`.
- **Permissions Required (to be implemented in UI):**
  - `OPPORTUNITY_VIEW`
  - `OPPORTUNITY_CREATE`
  - `OPPORTUNITY_UPDATE`
  - `OPPORTUNITY_DELETE`
  - `OPPORTUNITY_STAGE`
  - `OPPORTUNITY_CLOSE`

## Future Integration (Phase 3D)
- **Quotation Engine:** A `WON` (or highly probable `OPEN`) Opportunity will seamlessly trigger the generation of a `Quotation`.
- The Opportunity remains strictly within the CRM domain and does not execute any Postings, Inventory deductions, or Accounting ledgers. That responsibility is handed off down the line to Sales Orders and Invoices.
