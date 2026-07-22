# User Management Module

## Overview
The User Management UI (`app/dashboard/users/page.tsx`) handles platform access, system authentication, and Role-Based Access Control (RBAC) mapping. It acts as the gatekeeper for the SaaS ERP.

## Features
- **User Listing:** Displays all system users bound to the current `companyId`.
- **Search & Filters:** Real-time client-side filtering by name, email, role, and active/inactive status.
- **Invite User:** Allows admins to provision a new user account with a specific role.
- **Edit User:** Allows modification of existing user's name and role.
- **Deactivate/Activate:** Safely suspends login access without deleting financial or historical audit logs by toggling the `role` to `inactive`.
- **Reset Password:** Allows generating a new temporary password for the user.

## Backend Integration
All actions route through `app/dashboard/users/actions.ts`:
- `fetchUsers()`: Loads all `prisma.user` records.
- `createUser(data)`: Validates unique email before creating the user.
- `updateUser(id, data)`: Updates the name and role.
- `toggleUserStatus(id, isActive)`: Switches the user to the `inactive` role or restores them to `member`.

## Security (RBAC)
- **Isolation:** The `getSession()` token explicitly filters `companyId`.
- **Authorization:** Each server action manually verifies access against permissions like `VIEW_USERS`, `CREATE_USER`, and `EDIT_USER`.
