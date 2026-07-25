# Enterprise CRM Reports & Analytics Architecture (Sprint UI-3E)

The CRM Reports module provides an executive-level view of sales performance, pipeline health, and daily activities. It integrates deeply with all previously built CRM modules (Leads, Customers, Opportunities, Quotations, Sales Orders).

## Component Architecture

To maintain the 600-line limit and avoid external heavyweight charting dependencies (like Chart.js or Recharts), all visualizations are built using raw SVG and CSS Grid/Flexbox techniques.

### Reports Directory (`app/dashboard/crm/reports/`)
```
app/dashboard/crm/reports/
├── page.tsx                           // Main Dashboard
├── sales/page.tsx                     // Revenue & Funnel Analytics
├── pipeline/page.tsx                  // Pipeline & Forecast Analytics
├── performance/page.tsx               // Salesperson Leaderboards
├── activities/page.tsx                // Global Activity Feed
├── calendar/page.tsx                  // Calendar Grid View
└── components/
    ├── CRMReportCards.tsx             // KPI metrics with trends
    ├── SalesFunnelChart.tsx           // CSS Flexbox Funnel
    ├── RevenueChart.tsx               // SVG Line & Area chart
    ├── PipelineChart.tsx              // SVG Doughnut using stroke-dasharray
    ├── ConversionChart.tsx            // CSS Bar chart for Win/Loss
    ├── ForecastChart.tsx              // CSS progress bars against targets
    ├── ActivityFeed.tsx               // Chronological timeline
    ├── CalendarView.tsx               // CSS Grid 7-column calendar logic
    ├── SalesLeaderboard.tsx           // Ranking table
    └── ... (Filters, Export, Utilities)
```

## Chart Integrations
Because backend modification is strictly prohibited, the UI layer utilizes mock data arrays structured exactly how the future analytical API endpoints should respond. 

1. **SVG Revenue Chart**: Uses `<svg>`, `<polyline>`, and `<circle>` mapping an array of values to `(x,y)` coordinates.
2. **SVG Doughnut Chart**: Uses the `stroke-dasharray` and `stroke-dashoffset` technique on an SVG `<circle>` to render pie slices proportionately.
3. **CSS Flex Charts**: Funnels and Progress bars utilize simple inline `width: x%` style bindings.

## Calendar Logic
`CalendarView.tsx` computes the offset of the first day of the month using `Date.getDay()` and generates a 42-cell CSS Grid to ensure 6 weeks are consistently rendered, maintaining layout stability.

## Responsive Rules
- **Desktop (min-width: 1024px)**: Charts and Tables sit side-by-side using CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`).
- **Mobile (max-width: 767px)**: Grid collapses to a single column. The Calendar matrix reduces font sizes, and horizontal scrolling is enabled for wide tables (Performance Matrix).
