# Enterprise Lead Management Architecture (Sprint UI-3A)

The Enterprise Lead Management module is the central CRM workspace for tracking prospects, managing activities, and driving conversions. It has been built using the Enterprise Component Library and adheres strictly to the 600-line modularity rule.

## UI Structure & Component Tree
The module is located at `app/dashboard/crm/leads/` to seamlessly integrate with the dashboard application shell.

### Directory Layout
```
app/dashboard/crm/leads/
├── page.tsx                  // List View Assembly
├── create/page.tsx           // Lead Creation Form
├── [id]/
│   ├── page.tsx              // Detail View Assembly
│   └── edit/page.tsx         // Lead Edit Form
└── components/               // 16 Modular Components
    ├── LeadTable.tsx         // Enterprise Data Table
    ├── LeadFilters.tsx       // Status & Priority Filters
    ├── LeadSearch.tsx        // Debounced Search Input
    ├── LeadToolbar.tsx       // Action Buttons
    ├── LeadStats.tsx         // KPI Summary
    ├── LeadCard.tsx          // Mobile-Optimized List Item
    ├── LeadTimeline.tsx      // Chronological Events
    ├── LeadNotes.tsx         // Rich Text Notes Display
    ├── LeadActivity.tsx      // Upcoming/Overdue Tasks
    ├── LeadHistory.tsx       // Audit Logs
    ├── LeadStatus.tsx        // Color-Coded Status Badge
    ├── LeadPriority.tsx      // Icon/Color Priority Badge
    ├── LeadTags.tsx          // Pill-based Tag List
    ├── LeadOwner.tsx         // Assigned User Display
    ├── LeadEmptyState.tsx    // "No Leads" Placeholder
    └── LeadLoading.tsx       // Skeleton Loaders
```

## Architecture & API Usage
The module operates purely as a presentation layer consuming the **frozen** backend API endpoints defined in `app/api/crm/leads/route.ts` (and dynamic `[id]` endpoints). No Prisma models or business logic were modified during the UI build.

### Data Flow
1. **List View**: The `LeadsPage` manages state for search queries and filters. It calls `/api/crm/leads?search=...&status=...` and passes the response array to `LeadTable` (or `LeadCard` on mobile).
2. **Detail View**: `LeadDetailPage` dynamically fetches a specific lead using `params.id` and renders a tabbed interface splitting Overview, Timeline, Notes, Activities, and History.
3. **Forms**: Both Create and Edit pages serialize form states into JSON and send `POST`/`PUT` requests, handling loading states and automatic redirection upon success.

## Responsive Rules
- **Desktop (min-width: 1024px)**: Full Data Table with horizontal scrolling. Side-by-side forms for data entry.
- **Tablet (min-width: 768px)**: Data Table adapts with truncated text; Grid layouts adjust from 4 columns to 2.
- **Mobile (max-width: 767px)**: `LeadTable` is swapped out for a stacked list of `LeadCard` components to prevent horizontal overflow and improve touch targets. Navigation tabs switch to horizontal scrolling.

## Accessibility (A11y)
- Standard HTML semantic elements used alongside proper `label` bindings in forms.
- High-contrast colors utilized from the `globals.css` Vanilla CSS tokens.
- Fully traversable via keyboard (Focus visible states applied in root CSS).
