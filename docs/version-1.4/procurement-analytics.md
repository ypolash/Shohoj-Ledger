# Enterprise Procurement Analytics

## Architecture

The **Enterprise Procurement Analytics** module provides real-time, read-only aggregation services across the entire Version 1.4 Procurement lifecycle.

**CRITICAL RULE:**
This module strictly performs `findMany`, `count`, `aggregate`, and `groupBy` operations. It is mathematically decoupled from transactional logic and will **never** mutate data.

## KPI Definitions & Calculations

- **Total Suppliers:** Count of all registered Supplier profiles.
- **Open Purchase Orders:** Count of POs in `OPEN` or `PARTIALLY_RECEIVED` states.
- **Outstanding Supplier Balance:**
  - `Formula:` Sum(All `POSTED` Supplier Invoices) - Sum(All `POSTED`, `PARTIALLY_ALLOCATED`, and `FULLY_ALLOCATED` Supplier Payments).
- **Top Suppliers:** Aggregation of `totalAmount` across `POSTED` Supplier Invoices grouped by `supplierId`, ordered descending.
- **Purchase Variance:**
  - `Formula:` Sum(`varianceAmount`) across all `ThreeWayMatch` records where status is not `MATCHED`.
- **Procurement Cycle & Lead Time:** Average calculated durations between Requisition -> PO -> GRN -> Invoice -> Payment (mocked in current iteration).

## Data Sources

The Analytics Engine relies exclusively on the frozen/architected schemas:
- `Supplier`
- `PurchaseRequisition`
- `RequestForQuotation`
- `PurchaseOrder`
- `GoodsReceiptNote`
- `SupplierInvoice`
- `SupplierPayment`
- `ThreeWayMatch`

It does not duplicate any logic; it acts as a high-level orchestration query layer.

## Performance Considerations

- **Aggregation Load:** Heavy queries like `getTopSuppliers` use native Prisma `groupBy` pushing the computational load to the database engine.
- **Caching Readiness:** Designed to be easily wrapped in Redis caching layers for frontend consumption.
- **Monthly Bounds:** All queries accept `startDate` and `endDate` boundaries to prevent table scans on multi-year datasets.

## Security

**RBAC Enforcement:**
- `PROCUREMENT_ANALYTICS_VIEW`: Explicit permission required to view cross-company metrics.
- `PROCUREMENT_REPORT_EXPORT`: Dedicated permission for downloading these aggregates to CSV/PDF.

**Tenant Boundary:** 
Every single query strictly requires a `companyId` preventing cross-tenant data spillage.

## Future Scope

- **AI Integration:** Pass these structured KPI JSONs to an LLM for natural language "Spend Analysis".
- **BI Tools:** Expose these endpoints natively for Metabase/PowerBI integrations.
- **Predictive Restocking:** Combine Lead Time analysis with Inventory forecasting algorithms.
