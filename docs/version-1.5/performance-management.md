# Version 1.5 - Enterprise Performance Management

## 1. Architecture
The Performance Management module exists entirely outside the mathematical scope of the Payroll Engine. It governs the qualitative and quantitative evaluations of employees across arbitrary time cycles.

**Core Models:**
- **`PerformanceCycle` & `PerformanceGoal`:** Establishes the temporal boundaries (e.g., Q3 2026) and the specific, weighted targets expected of the employee during that time.
- **`PerformanceReview` & `PerformanceScore`:** The central document for an evaluation. It transitions through a rigid lifecycle (`DRAFT` ➔ `SELF_SUBMITTED` ➔ `MANAGER_SUBMITTED` ➔ `APPROVED`). Individual categorical scores (KPI, Leadership, etc.) roll up into the `overallRating`.
- **`PerformanceFeedback`:** A multi-use ledger capturing narrative feedback, cleanly separating the author (`SELF`, `MANAGER`, `PEER`, `HR`).
- **`PerformanceImprovementPlan` (PIP):** A corrective tracking mechanism explicitly tied to an employee and a cycle to document required behavioral or technical rectifications.

## 2. The Evaluation Workflow
1. **Cycle Initialization:** HR creates a `PerformanceCycle`. Managers and Employees negotiate and lock `PerformanceGoal`s.
2. **Self Review:** The employee submits `submitSelfReview()`, entering their own feedback and pushing the status to `SELF_SUBMITTED`.
3. **Manager Review:** The assigned manager (enforced via `reviewerId`) executes `submitManagerReview()`, appending their official scores and narrative feedback.
4. **Approval & Scoring:** `approveReview()` invokes `calculateScore()`. This averages the weights of the recorded `PerformanceScore` rows, saves the `overallRating`, and locks the review as `APPROVED`.

## 3. Payroll Bonus Integration (Future-Proofing)
While this module calculates scores, it **never** calculates currency. 
- **The Boundary:** The Payroll Engine (Phase 6) is designed to read from the Performance module. During a future bonus run, Payroll can query `PerformanceReview` looking for `status === 'APPROVED'` and `overallRating >= 4.0`. Payroll will then generate the `PayrollAdjustment` (Bonus) based on that rating.
- **Strict Isolation:** `performanceService.ts` contains zero references to `SalaryStructure` or `PayrollRun`.

## 4. Security & Audit
- **Multi-Tenant Protection:** Every cycle traces up to `{ companyId }`.
- **Role Permissions Added:** `PERFORMANCE_VIEW`, `PERFORMANCE_CREATE`, `PERFORMANCE_REVIEW`, `PERFORMANCE_APPROVE`.
- **Reviewer Lock:** `submitManagerReview()` physically blocks execution if the `reviewerId` does not match the assigned manager on the review document.
- **Audit Logging:** Instead of monolithic JSON blobs, distinct `PerformanceScore` and `PerformanceFeedback` tables ensure every line of feedback is permanently attributed to its `authorId` and immutable timestamp.
