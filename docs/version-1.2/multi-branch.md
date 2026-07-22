# Version 1.2 Multi-Branch Architecture Foundation

## Architecture

The Multi-Branch extension allows a single tenant (`Company`) to partition its operations, assets, employees, and finances across multiple physical or logical locations (`Branch`). 
This phase lays the structural foundation for branch-based Access Control Lists (ACL) and user segregation without disrupting the existing flat v1.1 data structure.

## Models Created

### 1. `Branch`
- **Purpose**: Defines the physical or logical entity within a company.
- **Fields**: `id`, `companyId`, `name`, `code`, `address`, `phone`, `email`, `managerId`, `isActive`, `createdAt`, `updatedAt`.
- **Relations**: `Company`, `User` (Manager).

### 2. `BranchUser`
- **Purpose**: Maps existing system users to one or more branches they are authorized to access, along with a contextual role.
- **Fields**: `id`, `branchId`, `userId`, `roleType`, `createdAt`.
- **Relations**: `Branch`, `User`.
- **Role Type (`BranchRoleType`)**: `MANAGER`, `STAFF`, `VIEWER`.

### 3. `BranchPermission`
- **Purpose**: Overrides or extends global roles with specific permissions applied *only* when the user is operating within the context of a specific branch.
- **Fields**: `id`, `branchId`, `roleId`, `permissionId`, `createdAt`.
- **Relations**: `Branch`, `Role`, `Permission`.

## Security & Multi-Company Isolation

- **Tenant Boundary**: A `Branch` strictly belongs to a `Company`. Any query for branches must include `companyId` retrieved from the user's active session.
- **Sub-Tenant Isolation**: The introduction of `BranchUser` and `BranchPermission` means a user can have global `VIEW` access but `MANAGE` access *only* for the `Branch` they are assigned to. 
- **Permissions**: Added `BRANCH_VIEW`, `BRANCH_CREATE`, `BRANCH_UPDATE`, `BRANCH_DELETE`, and `BRANCH_MANAGE_USERS`.

## Future Migration Strategy

Currently, no business tables (e.g., `Employee`, `Asset`, `LedgerEntry`) contain a `branchId` field. 

**When migrating to Phase 8 / Full Multi-Branch execution:**
1. A nullable `branchId` field will be added to core tables (`Employee`, `Attendance`, `Project`, `Income`, `Expense`, `Task`).
2. A data migration script will assign all existing records to a "Head Office" or "Main Branch" automatically generated for the company, ensuring no orphaned data.
3. API endpoints will be updated to accept an optional `?branchId=X` parameter. The middleware will validate if the current user's `BranchUser` mapping allows access to that specific branch.

## Risks

- **Data Siloing**: If a user is assigned to a branch but needs global visibility (like an Owner), the querying logic must seamlessly bypass the `branchId` filter. (Mitigation: Implement a `isGlobalAdmin` flag or bypass logic in the future `branchAccessService`).
- **Reporting Complexity**: Aggregating data across multiple branches for a single P&L report requires careful SQL JOINs to avoid duplicating numbers if an employee or asset moves between branches. (Mitigation: Ensure historical tracking for assets/employees when they transfer branches).
