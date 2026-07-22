# Version 1.2 Risk Register

| Risk ID | Category | Description | Severity | Probability | Mitigation Strategy |
|---------|----------|-------------|----------|-------------|---------------------|
| R-01 | **Database** | Infinite loop in `WorkflowEngine` triggering circular webhook/email steps. | High | Low | Enforce max execution depth/recursion limits in the Workflow Executor logic. |
| R-02 | **Data** | Analytics Snapshots bloating the database and degrading insert performance. | Medium | High | Implement cron-driven cleanup jobs for snapshots older than 90 days. |
| R-03 | **Security** | API Keys exposed through front-end payload sniffing. | Critical | Low | Only display raw API key once on creation. Rest of lifecycle only uses `hashedKey`. |
| R-04 | **Architecture**| Branch Managers escalating privileges across branches. | High | Low | Strictly validate `branchId` context inside the `BranchAccessService` for all incoming PUT/DELETE requests. |
| R-05 | **Legacy** | v1.1 APIs crashing due to missing `warehouseId` on `PurchaseOrder`. | Medium | Low | All newly introduced fields on legacy models are nullable (`?`) or have `@default` values. |
| R-06 | **Android** | Mobile application crashes due to unexpected GraphQL/REST schema additions. | Low | Low | Backend does not auto-expose new relational arrays unless explicitly queried. API responses remain unchanged. |
