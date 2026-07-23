# Enterprise Reorder Planning & Procurement (Phase 2N)

## 1. Architecture
The Phase 2N Reorder Engine bridges the gap between Inventory (Warehouse) and Procurement (Purchasing). Instead of buyers manually walking the aisles to guess what needs to be ordered, the system programmatically evaluates live stock against statistical `ReorderPolicy` definitions.

## 2. Reorder Algorithm
The `evaluateProduct()` method calculates the exact replenishment need by looking at both physical reality and financial commitments:
1. **Current Stock**: Live physical stock fetched directly from `ProductWarehouse` (Phase 2A).
2. **On Order Stock**: Inbound quantities from approved but unreceived Purchase Orders.
3. **Effective Stock**: `Current Stock + On Order Stock`. 
4. **Reorder Point**: If `Effective Stock` drops below the `reorderPoint`, a Purchase Request is triggered.
5. **Reorder Quantity**: If a static `reorderQuantity` is defined, the system recommends that amount. If not, it calculates the deficit up to the `maximumQuantity`.

## 3. Purchase Request Workflow
The engine generates internal **Purchase Requests**, not Purchase Orders. This provides a critical approval layer.
1. **DRAFT**: Reorder Engine auto-generates requests grouping by Warehouse.
2. **APPROVED**: Warehouse Manager reviews and approves the requested quantities.
3. **CONVERTED_TO_PO**: `convertToPurchaseOrder()` groups the lines by `Supplier` and dynamically hands them off to the legacy Purchase Order service, converting them into legally binding POs.

## 4. Accounting Integration Rule
**Zero Accounting at Request.** 
A Purchase Request represents a desire to buy, not a financial commitment. There are NO Journal Entries generated during Phase 2N. 
Accounting only occurs when the PO is received (Phase 2G - Goods Receipt) which touches the Valuation Engine (Phase 2M).

## 5. Security & Validation
- **Tenant Isolation**: `companyId` strictly boundaries all policy lookups, requests, and conversions.
- **RBAC**: Integrated `REORDERPOLICY_VIEW`, `REORDERPOLICY_MANAGE`, `PURCHASEREQUEST_VIEW`, `PURCHASEREQUEST_CREATE`, `PURCHASEREQUEST_APPROVE`, and `PURCHASEREQUEST_CONVERT` into `defaultPermissions.ts`.

## 6. Future Scalability (Phase 2P Preparedness)
- **Safety Stock Math**: `calculateSafetyStock()` is currently static but structurally prepared to accept standard deviation inputs from a future Demand Forecasting engine.
- **Bulk Processing**: `generatePurchaseRequests()` is designed to run non-interactively. This allows it to be hooked into a nightly Cron job that automatically evaluates thousands of products while the warehouse sleeps.
