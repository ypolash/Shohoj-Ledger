# Enterprise Customer Management Architecture (Sprint UI-3B)

The Enterprise Customer Management module acts as the Customer Master for the entire ERP system. It houses all critical customer data, financial summaries, and related records (Orders, Invoices, Payments, Projects, and Leads). It is built using the Enterprise Component Library and strictly adheres to the 600-line modularity rule.

## UI Structure & Component Tree

The module is structurally integrated into `app/dashboard/crm/customers/`.

### Directory Layout
```
app/dashboard/crm/customers/
├── page.tsx                           // List View Assembly
├── new/page.tsx                       // Customer Creation Form
├── [id]/
│   ├── page.tsx                       // Master Profile Detail View
│   └── edit/page.tsx                  // Customer Edit Form
└── components/                        // Modular Components
    ├── CustomerTable.tsx              // Enterprise Data Table
    ├── CustomerFilters.tsx            // Group/Status Filters
    ├── CustomerSearch.tsx             // Debounced Search Input
    ├── CustomerToolbar.tsx            // Export/Refresh Actions
    ├── CustomerStatistics.tsx         // KPI Summary (Total, Active, Outstanding)
    ├── CustomerCard.tsx               // Mobile-Optimized List Item
    ├── CustomerProfile.tsx            // Overview & Registration Info
    ├── CustomerContacts.tsx           // Primary & Secondary Contacts
    ├── CustomerAddresses.tsx          // Billing & Shipping Addresses
    ├── CustomerTimeline.tsx           // Chronological Events/Interactions
    ├── CustomerNotes.tsx              // Pinned & Quick Notes
    ├── CustomerActivities.tsx         // Tasks and Meetings
    ├── CustomerFiles.tsx              // Document Attachments
    ├── CustomerTags.tsx               // Categorization Tags
    ├── CustomerFinancialSummary.tsx   // Outstanding, Limits, Sales YTD
    ├── CustomerOrders.tsx             // Related Sales Orders
    ├── CustomerInvoices.tsx           // Related Invoices
    ├── CustomerPayments.tsx           // Payment History
    ├── CustomerProjects.tsx           // Related Active Projects
    ├── CustomerEmptyState.tsx         // "No Customers" Placeholder
    └── CustomerLoading.tsx            // Skeleton Loaders
```

## Architecture & API Usage
The module strictly operates as a presentation layer consuming the **frozen** backend API endpoints defined in `app/api/crm/customers/route.ts` and dynamic endpoints.

### Data Flow
1. **List View**: `CustomersPage` manages state for search queries and filters. It calls `/api/crm/customers?query=...&status=...&groupId=...` and passes the response to `CustomerTable` (desktop) or `CustomerCard` (mobile).
2. **Detail View**: `CustomerDetailPage` fetches a specific customer using `params.id` and renders a comprehensive tabbed interface splitting Overview, Financials, Related Records, Timeline, and Notes & Files.
3. **Forms**: Both Create (`new/page.tsx`) and Edit (`[id]/edit/page.tsx`) pages handle data entry, sending `POST`/`PUT` requests, and automatically redirecting upon success.

## Responsive Rules
- **Desktop (min-width: 1024px)**: Full Data Table with horizontal scrolling. Side-by-side forms and grid layouts for related records (e.g., Contacts, Addresses).
- **Tablet (min-width: 768px)**: Data Table adapts; Grid layouts adjust from multiple columns down to 2 columns.
- **Mobile (max-width: 767px)**: `CustomerTable` swaps to stacked `CustomerCard` components. Navigation tabs switch to horizontal scrolling to prevent wrapping overflow. Form fields stack vertically.

## Accessibility (A11y)
- Standard HTML semantic elements used alongside proper `label` bindings in forms.
- High-contrast colors utilized from the `globals.css` Vanilla CSS tokens.
- Fully traversable via keyboard with focus rings applied system-wide.
