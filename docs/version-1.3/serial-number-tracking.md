# Enterprise Serial Number Tracking (Phase 2E)

## 1. Architecture
The Phase 2E serial tracking architecture establishes strict, unit-level traceability. Unlike batches which group hundreds of items under a single identifier, the `InventorySerial` model enforces a 1:1 relationship with a physical unit.
The `InventorySerial` row sits completely adjacent to the `ProductWarehouse` aggregation row. Every single operational shift (receive, transfer, issue) on a serial inherently triggers the `StockMovement` engine to mathematically balance the aggregate quantities while logging the precise UUID of the serial that moved.

## 2. Serial Lifecycle & Statuses
A serial number traverses the supply chain using strict status guards:
- **AVAILABLE**: Actively sitting in a bin, ready for issue.
- **RESERVED**: Locked to a pending Sales Order, unavailable for other issues.
- **ALLOCATED**: Assigned to a packing list.
- **SOLD**: Issued out of the warehouse. The system records `soldDate` and `assignedCustomerId` for future warranty validation.
- **RETURNED**: Brought back via RMA. Temporarily decoupled from Available stock until inspected.
- **REPAIRED**: Fixed by service tech, ready to be marked Available again.
- **SCRAPPED / DAMAGED / LOST**: Removed from the physical calculation via an `ADJUSTMENT_OUT` movement.

## 3. The Stock Movement Guarantee
Just like Phase 2D (Batches), it is architecturally illegal to modify `ProductWarehouse` quantities directly when processing Serials.
When a Serial is Received, Issued, Transferred, or Scrapped, the `serialService.ts` executes an atomic Prisma `$transaction`. It updates the `InventorySerial` status, invokes `stockMovementService.recordMovement()` to handle the physical quantity mathematics, and subsequently attaches the `serialId` to the generated `StockMovement` log.

## 4. Warranty & Service Readiness
The database natively captures the exact moment a unit leaves the warehouse (`soldDate`) and who purchased it (`assignedCustomerId`). This allows the future CRM and Support modules to perform instant warranty entitlement lookups simply by scanning the barcode.

## 5. Security & Isolation
- Added `SERIAL_VIEW`, `SERIAL_MANAGE`, `SERIAL_TRANSFER`, and `SERIAL_SCRAP` to the RBAC matrix.
- `validateSerial()` forces all queries to map through the authenticated `companyId`, making cross-tenant data bleed physically impossible.
- The composite unique constraint `@@unique([companyId, productId, serialNumber])` prevents a warehouse clerk from accidentally receiving the same serial number twice for the same SKU.

## 6. Scalability Assessment
Because `serialId` is logged directly on the `StockMovement` table, the system can render a complete "Birth to Death" timeline of a high-value item with a single indexed query (`getSerialHistory`). This will comfortably support millions of serials without degrading the performance of the core `ProductWarehouse` aggregations.
