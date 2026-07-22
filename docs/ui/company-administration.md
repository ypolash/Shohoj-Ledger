# Company Administration Module (Connected)

## Overview

The Company Administration module is the centralized hub for managing tenant-specific settings, resources, and access control in the Shohoj Ledger Enterprise system. In Phase 2B, this UI was fully connected to the existing Prisma backend via Next.js Server Actions.

## UI Components (`app/dashboard/settings/page.tsx`)

The settings panel uses a robust vertical tab layout, ensuring easy navigation between different administrative domains. The data is centrally fetched using `loadAdminData()` and drilled down.

### 1. Company Profile (`<CompanyProfile />`)
- **Fields:** Company Name, Business Type, Status (Read-only).
- **Backend:** Connects to `prisma.company`. Updates via `updateProfile()`.

### 2. Preferences & Schedule (`<CompanySettings />`)
- **Fields:** Currency, Timezone, Shift Start/End, Grace Period.
- **Backend:** Connects to `prisma.companySetting`. Updates via `updateSettings()`.

### 3. Module Management (`<ModuleManagement />`)
- **Features:** Dynamic list of installed modules with modern toggle switches.
- **Backend:** Connects to `prisma.companyModule`. Toggled via `toggleModuleAction()`.

### 4. User Management (`<UserManagement />`)
- **Features:** Data table listing all users in the company. 
- **Backend:** Fetches `prisma.user`. Deactivates (sets role to 'inactive') via `deactivateUserAction()`. Updates role via `assignUserRoleAction()`.

### 5. Role Management (`<RoleManagement />`)
- **Features:** Table of existing roles (differentiating between System Default and Custom roles). 
- **Backend:** Leverages `RbacService.createRole()` and `RbacService.deleteRole()`.

### 6. Permission Management (`<PermissionManagement />`)
- **Features:** Granular matrix of permissions assigned to a specific role.
- **Backend:** Leverages `RbacService.assignPermissions()`. Checks for default roles and locks modification if needed.

## Design System

The module strictly adheres to the established premium SaaS design language:
- **Architecture:** Local `useState` for rapid tab switching, backed by Server Actions (`actions.ts`).
- **Styling:** Vanilla CSS Modules (`page.module.css`).
- **Aesthetics:** Glassmorphism (`backdrop-filter`), smooth transitions, responsive grids, dark mode gradients.

## Constraints & Security

As per Version 1.1 Phase 2B rules:
- **No Schema Changes:** The UI relies entirely on the pre-existing database architecture established in V1.0.0.
- **No API Duplication:** All integrations are done via direct Prisma operations encapsulated in Server Actions (`actions.ts`), strictly adhering to existing business logic.
- **Data Isolation:** All queries explicitly enforce the `companyId` constraint fetched securely from the active session (`getSession()`).
