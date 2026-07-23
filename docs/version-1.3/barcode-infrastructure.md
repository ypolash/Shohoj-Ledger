# Enterprise Barcode & QR Code Infrastructure (Phase 2F)

## 1. Architecture
The Phase 2F Barcode Infrastructure is intentionally decoupled from physical tables (Product, Batch, Serial, Warehouse, Bin). Instead of adding a `barcode` column to every single table and dealing with polymorphic nightmare queries during scanning, we created a centralized `Barcode` index model.
The scanner software will simply query the `Barcode` table with the scanned string. The engine will instantly resolve the `entityType` and `entityId`, routing the scanner UI to the correct workflow (e.g., "You scanned a Warehouse Bin", or "You scanned a Serial Number").

## 2. Supported Entity Types
The system tracks codes for:
- `PRODUCT`: Master SKU scanning.
- `BATCH`: Scanning a pallet/lot identifier.
- `SERIAL`: Scanning a specific physical unit.
- `WAREHOUSE`: Scanning a building door/location.
- `ZONE`: Scanning a physical aisle/zone.
- `BIN`: Scanning a physical rack location for a put-away operation.

## 3. Supported Barcode Types
The infrastructure supports standard industrial formats: `CODE128`, `CODE39`, `EAN13`, `EAN8`, `UPC`, and high-density `QR`.
QR codes are hashed with SHA256 using the Tenant ID + Entity ID payload to ensure absolute uniqueness globally across all companies in the ERP.

## 4. Label Generation Architecture
The `printLabelData()` method acts as the translation layer between the raw database UUIDs and human-readable printer payloads. It returns exactly what a Zebra or Dymo printer API needs: The raw barcode string, the human-readable Title (e.g., "MacBook Pro"), and the human-readable Subtitle (e.g., "SN: X12345").

## 5. Security & Isolation
- Added `BARCODE_VIEW`, `BARCODE_GENERATE`, and `BARCODE_PRINT` to `defaultPermissions.ts`.
- `validateEntity()` strictly maps every lookup through the authenticated `companyId`, ensuring cross-tenant data bleed is impossible.
- Generating a barcode automatically logs `generatedById` for the employee who triggered the print sequence.

## 6. Scanner Readiness
This phase perfectly stages the environment for an Android/iOS scanner application. Because lookups (`lookupBarcode`, `lookupQRCode`) are centralized, the mobile app only needs one API endpoint. When a worker pulls the trigger on a barcode gun, the backend instantly resolves the string and tells the gun exactly what physical entity they are holding.
