# Version 1.5 - Enterprise Attendance & Shift Management

## 1. Architecture
The Enterprise Attendance module extends the legacy lightweight `Attendance` model without corrupting its structure. By retaining `Attendance` as the absolute source of truth for check-in/check-out timestamps and GPS limits (`AllowedNetwork`), backward compatibility with existing Android apps and legacy APIs is guaranteed 100%.

**Core Additions:**
- **`AttendanceShiftAssignment`:** Binds an `Employee` to a `WorkShift` over a time continuum, supporting rotating shifts.
- **`AttendanceException`:** Automatically spawns derived data records whenever a check-in violates the assigned Shift criteria (e.g., LATE, MISSING_CHECKOUT).
- **`AttendanceAdjustment`:** The manual workflow overriding raw check-in data, enforcing manager-level approvals.
- **`AttendanceOvertime`:** Granularly tracks normal OT, weekend OT, and holiday OT separately from the raw attendance.
- **`AttendanceRoster`:** Schedules the workforce into the future, projecting shift alignments.

## 2. Shift Engine & Roster
The `attendanceService` is equipped to parse the Shift Engine.
- Grace periods, break times, and night-shift overlaps (where check-out spans into the next calendar day) are extracted from the underlying `WorkShift` mapping.
- `generateRoster()` mathematically plots out `PLANNED` attendance records for future weeks based on the assignment rules, facilitating proper capacity planning.

## 3. Exceptions & Adjustments
The architecture moves away from manual boolean toggles for "Late". 
- **Detection:** `detectExceptions()` mathematically creates an `AttendanceException` whenever a shift rule is broken.
- **Correction:** Employees or Managers use `AttendanceAdjustment` to submit "Correction" or "Override" requests. Once `approveAdjustment()` fires, it recalculates the active attendance parameters.

## 4. Payroll Integration (Strict Boundary)
The core tenant of this module is that **Attendance calculates Time, not Money.**
- `calculateWorkingHours()` and `calculateOvertime()` will output accurate `hours` or `minutes`.
- The service will **never** generate a financial amount (e.g., deducting $50 for late arrival).
- Instead, the forthcoming Payroll engine will consume the aggregate `AttendanceException` and `AttendanceOvertime` arrays and apply the financial multipliers configured in the `EmployeeGrade`.

## 5. Security & Audit
- **Company Boundary:** All assignments, rosters, and overrides are fiercely protected by the `companyId` index.
- **Approval Chains:** Overtime and Adjustments mandate an `approvedById` tracking the HR or Manager who authorized the change.
- **Role Permissions Added:** `ATTENDANCE_ADJUST`, `ATTENDANCE_APPROVE`, `OVERTIME_APPROVE`, `ROSTER_MANAGE`. 
- **Audit Logs:** Legacy attendance `update` actions are minimized in favor of the append-only ledger style of `AttendanceAdjustment` records, ensuring 100% auditable history.
