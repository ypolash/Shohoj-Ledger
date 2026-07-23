# Enterprise Warehouse Analytics Engine (Phase 2O)

## 1. Architecture
The Phase 2O Analytics Engine serves as the central nervous system for all warehouse intelligence. In legacy systems, reporting was often scattered across individual modules, leading to inconsistent KPIs (e.g. Sales reporting a different inventory value than Accounting). 

In Version 1.3, this service centralizes the logic. It sits on top of the transactional engines (Valuation, Movement, Operations) and safely aggregates their data for Dashboards, BI Tools, and Android mobile applications.

## 2. Core KPIs & Definitions
- **Total Inventory Value**: Dynamically calculated by the `valuationService` representing the precise financial asset value of the physical goods.
- **Inventory Aging**: Segments inventory value into time brackets (0-30, 31-90, 91-180, 180+ days) based on the exact `createdAt` timestamp of the FIFO layers.
- **Warehouse Utilization %**: Calculates the physical footprint by dividing the number of bins that hold >0 quantity against the total active bins in the warehouse.
- **Cycle Count Accuracy**: Measures the percentage of cycle count lines that were verified with zero mathematical variance.
- **Batch Expiry**: Flags batches that have already expired or will expire within the next 30 days.

## 3. Data Source Delegation (No Duplicate Logic)
The service strictly obeys the blueprint rules:
- **Never duplicate business logic.**
- `getInventoryValue()` delegates instantly to `valuationService.calculateInventoryValue()`.
- Out of stock calculations query `ProductWarehouse` (managed by `stockMovementService`).
- Accuracy metrics directly query the closed records of `cycleCountService`.
By reusing the base transaction models, the analytics are mathematically guaranteed to match the ledger.

## 4. Performance & Scalability
Because analytical queries on millions of stock movements can paralyze transactional databases:
1. **Targeted Aggregation**: The system heavily relies on `prisma.$aggregate` and `_sum` to offload math to the SQL engine rather than loading arrays into memory.
2. **Snapshot Preparation**: Complex analytics (like historical turnover, ABC/XYZ classifications) have their architectures stubbed, preparing the system for a future caching layer (e.g., Redis or materialized views) that runs nightly.

## 5. Security
- **Tenant Isolation**: Every single aggregation metric enforces the `companyId` constraint. A user logged into Company A cannot accidentally query the global sum of Company B.
- **RBAC**: Access to these API routes will be gated by `WAREHOUSE_DASHBOARD_VIEW`, `WAREHOUSE_ANALYTICS_VIEW`, and `WAREHOUSE_REPORT_EXPORT` permissions.
