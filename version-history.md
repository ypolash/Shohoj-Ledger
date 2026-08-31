# Version History

## [2.4.1] - 2026-08-31
### Added
- **Purchases Expense & Dual-Entry AP Ledger Engine**:
  - Automatically recognizes and records completed purchases as an Operating Expense (`PURCHASE_EXPENSE`).
  - Automatically posts dual-entry ledger entries (Debit: `PURCHASE_EXPENSE`, Credit: `ACCOUNTS_PAYABLE`) upon purchase completion.
  - Seamlessly tallies purchase expenses in CFO Financial Dashboards, P&L reports, and cash flow projections.
  - Integrated with supplier payment drawers to debit AP liability and credit Cash/Bank upon settlement (`/api/inventory/purchases/[id]/payments`).
- **Universal Inventory Table Redesign 2.0**:
  - Unified table design system across all Inventory modules (Products, Categories, Warehouses, Stock, Orders, Purchases, Payments).
  - Glassmorphic elevated panels with subtle border accents and sticky gradient headers (`<InventoryDataTable>`).
  - Dual-line typography displaying product name alongside monospace SKU/Code tags.
  - Interactive stock level badges with animated status indicators (In Stock, Low Stock, Out of Stock, Damaged).
  - Integrated smart search toolbar with multi-criteria filtering, batch export actions, and polished loading/empty states.
- **Sales Order Redesign 2.0 (Single-Page 3-Section Architecture)**:
  - Header: Order Date and Expected Delivery Date grouped in the top-right corner.
  - Section 1: Customer type radio toggle (`Existing Customer` dropdown vs. `Temporary Customer` inline Name/Address/Phone/Email fields).
  - Section 2: Dedicated bordered product search bar with live auto-complete from inventory catalog for 1-click order insertion.
  - Section 3: Dynamic line items table with editable Quantity, pre-filled Unit Price, and real-time Row Total computation.
  - Bottom Bar: Relocated Customer Reference selection (with auto-discount calculation) and Global Discount inputs near order totals.
  - Cleanup: Removed legacy `Reference Number` and `Link to Quotation` fields for a streamlined user experience.
- **Onboarding 2.0 (Redesigned Signup Flow)**:
  - Streamlined 4-step onboarding wizard replacing the previous 6-step flow.
  - Step 1: Simplified company profile (Name, Email, Phone), built-in Company Logo picker with image preview, and relocated Business Type selector (Product vs Service, removed Hybrid).
  - Step 2: Merged Module selection with rich Prebuilt Industry Templates (IT & Software, Retail/E-Commerce, Manufacturing, Wholesale/Distribution, Healthcare, Consulting).
  - Step 3: Owner account setup with interactive real-time password requirement checklist (Uppercase, Lowercase, Number, 8+ characters) and mandatory Workspace Rules & Terms agreement checkbox.
  - Step 4: Redesigned enterprise review card displaying logo preview, industry template summary, active modules, and one-click workspace provisioning.
- **Universal Export Tooling**: 1-click export to CSV, Excel, and styled PDF purchase vouchers with dynamic company header letterheads.

### Fixed & Enhanced
- Replaced fragmented table styles across the inventory module with the reusable `<InventoryDataTable>` system.
- Removed country and timezone fields from initial onboarding to minimize customer drop-off.
- Replaced placeholder alert handlers in Purchases and Payments pages with validated async backend mutations.
- Enforced modular architecture keeping all newly introduced React components well under the 600-line limit.
- Verified multi-tenant systemSource isolation across inventory purchase routes.

## [2.3.0] - 2026-08-30
### Added
- Scaffolded Purchases & Payments pages in ERP Inventory.
- Added dynamic drawer for processing payments.
- Cleaned up Inventory Dashboard and removed redundant tab subtitles.

## [2.2.0] - 2026-08-28
### Added
- Redesigned `/erp/crm/sales-orders/[id]/invoice` print view to modern mint-green and dark-gray branding.
- Enforced `@media print` rules to hide sidebars and topbars during printing.

## [2.1.0] - 2026-08-27
### Fixed
- Defensive date parsing and query guards in CRM Leads API.

## [2.0.0] - 2026-08-26
### Added
- Product-based order integration connecting Sales Orders directly to inventory products.
- Customer quick actions ("+ Order") and dedicated Orders tab on Customer view page.
- Inventory Orders Hub with local CSV/JSON order imports.

## [1.1.0] - 2026-07-23
### Added
- Multi-company / Multi-tenant architecture.
- Centralized RBAC and permission checks.
- Comprehensive Audit System for enterprise tracking.
- Modular layout for HR, Finance, CRM, and Inventory.

### Fixed
- Fixed Next.js 15+ async `params` breaking changes across 18 dynamic API routes.
- Fixed module resolution errors in `inventory` and `finance` dashboards.
- Resolved Prisma JSON typing errors in audit routes.
- Corrected API imports from `@/lib/auth` to `@/lib/company/companyFilter`.

### Security
- Enhanced tenant isolation by enforcing `companyId` verification on all queries.
