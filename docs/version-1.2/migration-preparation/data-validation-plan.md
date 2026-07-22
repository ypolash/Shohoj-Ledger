# Data Validation Plan - Version 1.2

## Overview
Because the Version 1.2 schema migration is 100% additive, no existing data should be altered, dropped, or corrupted. This plan verifies the integrity of critical data models pre- and post-migration in the staging environment.

## 1. Company Records
- **Check**: Run `SELECT COUNT(*) FROM "Company";` before and after migration.
- **Goal**: Ensure the count remains identical. Ensure the `isActive` flag remains functionally intact.

## 2. Users
- **Check**: Spot-check 5 random `User` records.
- **Goal**: Verify that passwords, emails, and global `Role` bindings (RBAC) are fully preserved.
- **Check**: Ensure the new `branchUsers` array returns empty but does not crash when queried.

## 3. Employees
- **Check**: Run `SELECT COUNT(*) FROM "Employee";`
- **Goal**: Ensure HR records are untouched. The future `branchId` relation is null and harmless.

## 4. Financial Records
- **Check**: Sum the `amount` field in `LedgerEntry` for a specific test company.
- **Goal**: The sum before migration must exactly match the sum after migration. Zero variance permitted.

## 5. Attendance Records
- **Check**: Verify the latest `Attendance` clock-in timestamps.
- **Goal**: Ensure datetime timezone handling wasn't warped by database restarts.

## 6. Inventory Records
- **Check**: Query `StockTransaction` and `PurchaseOrder` tables.
- **Goal**: Verify that legacy `status` strings ("PENDING", "ACTIVE") remained as Strings and were not accidentally coerced into the new Enums (`PurchaseOrderStatus`) prematurely.
