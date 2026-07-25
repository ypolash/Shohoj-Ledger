# Enterprise Opportunity Management Architecture (Sprint UI-3C)

The Enterprise Opportunity Management module enables sales teams to track deals, manage their sales pipelines, forecast revenue, and move opportunities through customizable stages via a drag-and-drop Kanban board. It acts purely as a presentation layer leveraging the Enterprise Component Library.

## UI Structure & Component Tree

The module is structurally integrated into `app/dashboard/crm/opportunities/`.

### Directory Layout
```
app/dashboard/crm/opportunities/
├── page.tsx                           // List View Assembly
├── kanban/page.tsx                    // Visual Kanban Board View
├── pipeline/page.tsx                  // Sales Funnel Analysis
├── forecast/page.tsx                  // Revenue Forecast View
├── new/page.tsx                       // Opportunity Creation Form
├── [id]/
│   ├── page.tsx                       // Opportunity Detail Profile
│   └── edit/page.tsx                  // Opportunity Edit Form
└── components/                        // Modular Components
    ├── OpportunityTable.tsx           // Enterprise Data Table
    ├── OpportunityKanban.tsx          // Drag & Drop Board
    ├── OpportunityPipeline.tsx        // Sales Funnel Chart
    ├── OpportunityForecast.tsx        // Tabular Forecast
    ├── OpportunityFilters.tsx         // Stage/Owner Filters
    ├── OpportunitySearch.tsx          // Debounced Search Input
    ├── OpportunityToolbar.tsx         // View Switcher & Actions
    ├── OpportunityCard.tsx            // Mobile/Kanban Item
    ├── OpportunityValue.tsx           // Formatted Revenue
    ├── OpportunityProbability.tsx     // Visual Probability Bar
    ├── OpportunityOwner.tsx           // Avatar/Name Component
    ├── OpportunityTimeline.tsx        // Chronological Stage Changes
    ├── OpportunityActivities.tsx      // Upcoming Tasks/Meetings
    ├── OpportunityNotes.tsx           // Quick Notes
    ├── OpportunityProducts.tsx        // Linked Products & Pricing
    ├── OpportunityHistory.tsx         // Audit Logs
    ├── OpportunityEmptyState.tsx      // Placeholder UI
    └── OpportunityLoading.tsx         // Skeleton Loaders
```

## Architecture & API Usage
The module strictly operates as a presentation layer consuming the **frozen** backend API endpoints defined in `app/api/crm/opportunities/route.ts`.

### Data Flow
1. **List View**: The default `OpportunitiesPage` queries `/api/crm/opportunities` with URL search params for search and filters. Data is passed to `OpportunityTable`.
2. **Alternative Views**: 
   - `kanban/page.tsx` fetches the same list but passes it to `OpportunityKanban` for grouping.
   - `pipeline/page.tsx` passes data to `OpportunityPipeline` to calculate funnel width based on stage counts and sum revenue.
   - `forecast/page.tsx` passes data to `OpportunityForecast` for time-based calculations.
3. **Detail View**: `OpportunityDetailPage` fetches a specific deal using `params.id` and renders a tabbed interface (Overview, Timeline, Products & Quotes, History).
4. **Forms**: Both Create (`new/page.tsx`) and Edit (`[id]/edit/page.tsx`) pages handle POST/PUT operations and redirect upon completion.

## Responsive Rules
- **Desktop (min-width: 1024px)**: Full Data Table with horizontal scrolling. Side-by-side grids in details.
- **Tablet (min-width: 768px)**: Data Table adapts; Grid layouts adjust.
- **Mobile (max-width: 767px)**: List view swaps `OpportunityTable` for stacked `OpportunityCard` components. Kanban board requires horizontal scrolling. Forms stack vertically.

## Accessibility (A11y)
- Fully traversable via keyboard. Focus rings applied.
- High-contrast colors utilized from `globals.css` variables, respecting Light and Dark themes.
