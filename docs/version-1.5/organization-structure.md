# Version 1.5 - Enterprise Organization Structure

## 1. Architecture
The Enterprise Organization Structure module provides a shared foundational data layer across the entire Shohoj Ledger ERP. It models the core operating structure of any enterprise business and is strictly designed not to duplicate or corrupt the legacy Account, Inventory, and CRM modules (Version 1.3/1.4).
It leverages strict `companyId` isolation, providing the baseline for future Multi-Branch and Cost Center accounting capabilities.

## 2. Hierarchy
The structural hierarchy natively supports unlimited depth via recursive modeling, typically patterned as:
`Company` ➔ `Branch` ➔ `Division` ➔ `Department` ➔ `Section` ➔ `Team`

In parallel, role and employee typing are driven by:
- **Designation** (e.g., Software Engineer)
- **Job Position** (e.g., Finance Manager)
- **Employment Type** (e.g., Permanent, Contract)
- **Employee Grade** (determines Salary Band and Benefits)

## 3. Business Rules
- **Unlimited Hierarchy:** Achieved by allowing parent-child relationships through soft relations (e.g., Section links to Department, Team to Section).
- **Soft Delete:** Hierarchy nodes are deactivated (`isActive: false`) rather than hard deleted to preserve historical integrity.
- **Unique Coding:** `code` fields combined with `companyId` ensure unique references.
- **Future Reorganization:** Managers and head mapping (`headId`) allow seamless restructuring of teams and divisions without breaking transactional records.

## 4. Security & RBAC
- **Multi-Tenant Validation:** All queries enforce `{ companyId }`.
- **Permissions Added:**
  - `ORGANIZATION_VIEW`
  - `ORGANIZATION_CREATE`
  - `ORGANIZATION_UPDATE`
  - `ORGANIZATION_DELETE`
- **Future Branch Isolation:** Built-in hooks (`branchId` in Division and HolidayCalendar) pave the way for strict branch-level RBAC.

## 5. Audit
- Utilizing `EmployeeLifecycle` and `GlobalAuditLog`, any changes to hierarchy placement (like moving a team or promoting a Head of Department) are chronologically tracked.
- Status activation/deactivation triggers standard audit trails.

## 6. Future Integrations
This module prepares the groundwork for:
- **Payroll:** Linking `CostCenter` for automated salary allocation.
- **Attendance:** Mapping `WorkShift` and `HolidayCalendar` directly to employee attendance anomaly rules.
- **Procurement & CRM:** Funneling approval flows through structural Heads (e.g., Department Head approves POs).
