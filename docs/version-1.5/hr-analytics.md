# Version 1.5 - Enterprise HR Analytics

## 1. Architecture
The Enterprise HR Analytics module serves as the read-only reporting backend for the entire Shohoj HR & Payroll suite. It strictly consumes data via Prisma aggregations, performing no mutations or transactional inserts.

**Core Principles:**
- **No Side Effects:** The `hrAnalyticsService.ts` contains only read operations (`count()`, `findMany()`, `aggregate()`, `groupBy()`).
- **Isolation:** Analytics queries are designed to be decoupled from operational endpoints to ensure heavy reporting does not lock transactional rows.

## 2. Dashboards & Services
The service layer exposes 20 discrete methods partitioned into three categories:

### A. Executive Dashboards
- `getExecutiveDashboard()`: Yields the highest-level summary (Total Headcount, Active ratios, New Hires, Payroll Costs, Outstanding Loans).
- `getEmployeeDashboard()`, `getRecruitmentDashboard()`, `getAttendanceDashboard()`, `getLeaveDashboard()`, `getPayrollDashboard()`, `getPerformanceDashboard()`, `getTrainingDashboard()`

### B. Statistical Analysis
- `getTurnoverAnalysis()`: Measures termination counts.
- `getHeadcountTrend()`: Prepares the active employee vector.
- `getDepartmentDistribution()`: Aggregates active employees per department.
- `getLeaveStatistics()`, `getAttendanceStatistics()`, `getOvertimeStatistics()`: Measures operational discipline and resource availability.

### C. Financial & Operations Summaries
- `getPayrollSummary()`, `getSalaryDistribution()`
- `getLoanSummary()`, `getAdvanceSummary()`
- `getPerformanceSummary()`, `getTrainingSummary()`

## 3. Data Source Integrity
The analytics engine strictly reuses the data from:
- `Employee` (Phase 2)
- `Applicant` (Phase 3 ATS)
- `Attendance`, `AttendanceOvertime` (Phase 4)
- `LeaveApproval` (Phase 5)
- `PayrollRun`, `PayrollSnapshot` (Phase 6)
- `EmployeeLoan`, `SalaryAdvance` (Phase 7)
- `PerformanceReview` (Phase 8)
- `TrainingEnrollment` (Phase 9)

By querying these exact tables directly, the Analytics module guarantees zero data drift. If a Loan is paid off via the Posting Engine in Phase 7, the `getLoanSummary()` KPI immediately reflects that reality.

## 4. Security & Audit
- **Multi-Tenant Protection:** Every method strictly accepts and enforces a `{ companyId }` filter on its Prisma queries.
- **Role Permissions Added:** `HR_ANALYTICS_VIEW`, `HR_REPORT_EXPORT` are now the gateway roles required for accessing these endpoints in the future API layer.

## 5. Future Implementation Roadmap
- **Caching:** As datasets grow, we will implement Redis-level caching for heavy `aggregate()` and `groupBy()` calls that don't need real-time precision.
- **AI Integration:** This structured, normalized backend allows seamless future integration with LLM-based query systems to answer natural language questions (e.g., "What was the average performance rating of employees who took more than 5 days of sick leave?").
