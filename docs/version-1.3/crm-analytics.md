# Enterprise CRM Analytics Engine (Version 1.3 Phase 3L)

## Overview
The Enterprise CRM Analytics Engine provides a centralized, read-heavy service layer to extract insights, key performance indicators (KPIs), and aggregate trends across the entire CRM architecture. It serves as the data foundation for future Executive Dashboards, BI tool integrations, and AI-driven forecasting models.

## Architecture
- **Service Location:** `lib/analytics/crmAnalyticsService.ts`
- **Design Pattern:** The service leverages Prisma's `aggregate`, `groupBy`, and `count` functions to perform database-level calculations, minimizing memory footprint on the Node server.
- **Frontend Independence:** This module strictly handles data aggregation. It does NOT generate charts, graphs, or UI components, ensuring it can be seamlessly consumed by Next.js RSCs, internal APIs, Android clients, or future scheduled reporting cron jobs.

## KPI Definitions & Calculations
The service exposes specific dashboards and reusable deep metric functions:
1. **Executive Dashboard (`getExecutiveDashboard`)**
   - Combines overarching totals: Total/Active Customers, Leads (Total/Qualified), Open Opportunities, Quotations, Orders, Deliveries, Returns, and Outstanding Balances.
2. **Sales Performance (`getSalesDashboard`, `getSalesPerformance`)**
   - Calculates month-to-date revenue by aggregating `SalesOrder.totalAmount`.
   - Identifies top salespersons by grouping orders by `createdById`.
3. **Pipeline & Conversions (`getOpportunityDashboard`, `getConversionRates`)**
   - **Pipeline Value:** Sums `expectedValue` of all `OPEN` opportunities.
   - **Lead Conversion:** `(Qualified Leads / Total Leads) * 100`.
4. **Customer Insights (`getCustomerDashboard`, `getTopCustomers`)**
   - **Growth:** Counts customers created in the last 30 days.
   - **Retention:** `(Active Customers / Total Customers) * 100`.
   - Identifies top revenue-generating customers.
5. **Financial Operations (`getPaymentDashboard`, `getCommissionDashboard`)**
   - Summarizes cash influx vs. pending commissions using grouping by `status`.

## Data Sources
To guarantee consistency, the engine queries the native models established in previous Version 1.3 phases:
- `Customer`, `Lead`, `Opportunity`, `Quotation`
- `SalesOrder`, `DeliveryOrder`, `CustomerReturn`
- `CustomerPayment`, `SalesCommission`

**Rule Enforced:** No duplicate business logic. For complex algorithmic determinations (like credit availability), the engine delegates to the native domain service (e.g., `CustomerCreditService`).

## Caching Strategy & Performance (Preparation)
Given the potential volume of millions of records:
- **Phase 1.3 Implementation:** Utilizes direct Prisma aggregations which compile into highly optimized SQL `COUNT()`, `SUM()`, and `GROUP BY` statements.
- **Future Scale (V2.0+):** 
  - `Redis` will cache daily/monthly dashboard results.
  - Materialized views in PostgreSQL can be introduced for heavy historical reporting without altering this service layer's contract.

## Security & RBAC
- **Multi-tenancy:** Every aggregation strictly filters by `companyId`. Cross-tenant data leakage is mathematically impossible at the query level.
- **Access Control:** The following RBAC permissions dictate access to these endpoints:
  - `CRM_ANALYTICS_VIEW`: Grants view access to the dashboards.
  - `CRM_REPORT_EXPORT`: Grants ability to download raw CSV extracts (to be implemented in API route wrappers).

## Future AI Integration
This module outputs highly structured, flat JSON objects. In future phases, these standardized outputs will be fed directly into LLM endpoints to generate automated textual insights (e.g., "Sales dropped 12% this week, likely due to a lower lead conversion rate").
