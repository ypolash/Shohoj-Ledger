# Company Signup & Onboarding UI

## Overview

The Company Signup wizard is the first customer-facing entry point for the Shohoj Ledger Enterprise system. It leverages a modern SaaS design language to guide users through configuring their workspace, selecting modules, and provisioning their root owner account.

## User Flow

The wizard operates in six sequential steps:

1. **Company Information**: Collects core details (Name, Email, Phone, Country, Timezone).
2. **Business Type**: Determines if the company is Product, Service, or Hybrid (used for future template logic).
3. **Module Selection**: Allows the user to select which ERP modules (Finance, HR, Payroll, CRM) they want to enable.
4. **Industry Template**: Confirms the default templates to install (e.g., IT Company defaults).
5. **Owner Account**: Captures the root admin's credentials (Name, Email, Password).
6. **Review**: Displays a comprehensive summary of the payload.
7. **Provisioning**: Displays an animated progress overlay while the backend performs the atomic transaction. On completion, redirects to `/dashboard`.

## Backend Integration

The UI strictly reuses the existing backend multi-tenant architecture created in Phase 7:
- **API Endpoint:** `POST /api/auth/signup`
- **Service Layer:** `CompanyService.registerCompany(payload)`
- **Transaction Safety:** All database provisioning (Company, Roles, Modules, Owner) is handled in a single Prisma transaction by the backend. The UI only simulates the visual progress (Creating Company -> Creating Roles -> etc.) for UX purposes based on the backend's successful response.

## Validation

- Client-side validation is enforced at each wizard step before allowing progression.
- Empty fields, mismatched passwords, and missing module selections are prevented.
- Server-side validation errors (e.g., "Email is already registered") are gracefully caught and displayed within the UI's error banner without exposing stack traces.

## Design Patterns

- **Vanilla CSS Modules:** Implemented in `app/signup/page.module.css`.
- **Theme:** Dark mode, glassmorphism (`backdrop-filter`), vibrant gradients (`#00f2fe` to `#4facfe`), and fluid animations (`slideUp`, `fadeIn`).
- **Responsiveness:** Uses CSS Grid and Flexbox to adapt from desktop view to mobile view (collapsing 2-column forms to single-column).

## Future Enhancements

- Integrate real-time email verification during Step 5.
- Fetch available Industry Templates dynamically from the database.
- Integrate with Payment Gateway (Stripe) after Step 6 (Phase 10 integration).
