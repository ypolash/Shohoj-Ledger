# Version 1.5 - Enterprise Leave Management

## 1. Architecture
The Leave Management module is built as an independent pillar within the HR module. It is purposefully isolated from the daily Attendance module to enforce the rule: **Attendance tracks physical time; Leave tracks authorized absence.** 

**Core Models:**
- **`LeaveType` & `LeavePolicy`:** Define the types of leaves available and the overarching accrual, max-balance, and carry-forward rules.
- **`LeaveBalance` & `LeaveAccrual`:** The true ledger of an employee's time off. Uses double-entry style logic where accruals incrementally feed the balance, and encashments/usage deduct from it.
- **`LeaveRequest` & `LeaveApproval`:** Upgraded from the legacy v1.2 model, this now supports hierarchical multi-level approvals, half-day flags, and precise linking back to the dynamic `LeaveType`.
- **`LeaveEncashment`:** Bridges the gap between HR and Accounting for payout requests.

## 2. Leave Lifecycle & Approval
The standard flow progresses as: `SUBMITTED` ➔ `PENDING` ➔ `APPROVED` / `REJECTED`.
- The hierarchical setup in `LeaveApproval` allows Line Managers and HR to consecutively approve requests based on the policy's `approvalLevels`.
- A single `REJECTED` state from any level instantly cancels the entire flow.

## 3. Accrual & Carry Forward
`LeaveAccrual` records are generated via `accrueLeave()`. 
- **Automated:** Cron jobs (in Phase 6/7) will drop `MONTHLY` or `YEARLY` records into this table.
- **Manual:** HR can push `MANUAL` records to adjust anomalies.
- `carryForward()` mathematically reads year-end balances against `carryForwardLimit` boundaries to mint the starting balance of the new year.

## 4. Cross-Module Boundaries

### 4.1 Attendance Integration
- **Strict Rule:** `approveLeave()` does **not** run raw SQL updates on `Attendance` rows.
- **Interaction:** Once a `LeaveRequest` is `APPROVED`, the Attendance workers/UI will *read* this status. During attendance roster generation or exception detection (Phase 4 logic), an approved leave will legally override a `MISSING_CHECKIN` violation. 

### 4.2 Payroll Integration
- The Leave service acts as a read-only provider for the Payroll Engine.
- Payroll will fetch `LeaveRequest` summaries to detect Unpaid Leave for deductions.
- `LeaveEncashment` holds the financial payout requests which Payroll calculates the exact cash equivalent for based on the Employee's daily rate.

### 4.3 Accounting Integration
- `LeaveEncashment` requests never write raw Journal Entries.
- Upon final payroll clearance, the legacy Posting Engine will securely consume the encashment payload and insert a `postingReference` back into the encashment row, finalizing the audit trail.

## 5. Security & Audit
- **Strict Isolation:** Every leave policy, request, and balance explicitly traces to `{ companyId }` and `{ employeeId }`.
- **Role Permissions Added:** `LEAVE_VIEW`, `LEAVE_CREATE`, `LEAVE_APPROVE`, `LEAVE_ENCASH`.
- **Audit Logging:** Instead of editing balances raw, `LeaveAccrual` acts as the unalterable history of why a balance changed.
