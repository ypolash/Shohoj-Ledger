# Inventory ↔ Accounting Integration (Phase 1I)

## Architecture Overview
The Inventory module is no longer an isolated operational silo. With Phase 1I, every inventory movement (Purchase, Sale, Return, Adjustment) automatically broadcasts a `PostingRequest` to the Phase 1H Automatic Posting Engine.

## Structural Compliance
- **No Direct Journal Creation**: The `inventoryAccountingService.ts` explicitly builds agnostic payloads and hands them to `postingService.post()`.
- **Perpetual Inventory System**: Implemented dual-leg Sales Issues (simultaneously recognizing Revenue and calculating COGS against Inventory Assets).

## Supported Event Flows

### 1. Purchase Receipt
When a Purchase Order is marked as "Received":
- **Debit**: Inventory Asset
- **Credit**: Accounts Payable

### 2. Sales Issue
When an Invoice is marked "Dispatched":
- **Debit**: Accounts Receivable
- **Credit**: Sales Revenue
- **Debit**: Cost of Goods Sold (COGS)
- **Credit**: Inventory Asset

### 3. Sales Return
When Goods are returned by a customer:
- **Debit**: Inventory Asset
- **Credit**: Cost of Goods Sold (COGS)

### 4. Inventory Adjustment
When stock is audited and variances are found:
- *If Shortage (Negative)*: Debit Inventory Loss Expense, Credit Inventory Asset.
- *If Surplus (Positive)*: Debit Inventory Asset, Credit Inventory Gain.

## Reversal Strategy
If an Inventory Clerk deletes or voids a Purchase Receipt that was already posted, `inventoryAccountingService.reverseInventoryPosting()` is invoked. This delegates directly to `postingService.reverse()`, which will issue a counter-journal rather than deleting the historical ledger rows, preserving GAAP auditability.

## Audit & Security
- **Tenant Isolation**: `companyId` and `branchId` are funneled cleanly from the Inventory module into the Accounting module.
- **Traceability**: Every posted Journal retains `referenceType` (e.g., `SALES_ISSUE`) and `referenceId` (the exact UUID of the Dispatch Note).
- **RBAC**: Implemented `INVENTORY_POST` and `INVENTORY_POST_REVERSE`. These permissions are decoupled from standard Accounting permissions, meaning a Warehouse Manager can trigger a post without needing access to view the Balance Sheet.
