# Enterprise Quotation & Sales Order Architecture (Sprint UI-3D)

The Quotation and Sales Order modules represent the transitional phase between CRM (Opportunities) and core ERP (Accounting/Fulfillment). These modules provide a unified interface to generate professional proposals, calculate complex line-item math, and confirm orders for downstream invoicing.

## Component Architecture

Both modules strictly adhere to the 600-line constraint by relying on a shared Enterprise Component Library and utilizing highly fragmented child components.

### Quotations Directory (`app/dashboard/crm/quotations/`)
```
app/dashboard/crm/quotations/
├── page.tsx                           // List View (Data Table)
├── new/page.tsx                       // Builder Form
├── [id]/page.tsx                      // Detail View (Tabs)
├── [id]/edit/page.tsx                 // Edit Builder
├── preview/page.tsx                   // PDF Print Layout
└── components/
    ├── QuotationTable.tsx             // Data grid of quotes
    ├── QuotationForm.tsx              // Main form wrapper
    ├── QuotationItems.tsx             // Dynamic line-items with local state math
    ├── QuotationTotals.tsx            // Subtotal/Tax/Discount display block
    ├── QuotationStatus.tsx            // Badge coloring (Draft, Sent, Accepted)
    ├── QuotationPDF.tsx               // The professional printable template
    ├── QuotationTimeline.tsx          // Event history
    └── ... (Filters, Search, Toolbar, Notes, Attachments)
```

### Sales Orders Directory (`app/dashboard/crm/sales-orders/`)
```
app/dashboard/crm/sales-orders/
├── page.tsx                           // List View (Data Table)
├── new/page.tsx                       // Form
├── [id]/page.tsx                      // Detail View (Tabs)
├── [id]/edit/page.tsx                 // Edit Form
└── components/
    ├── SalesOrderTable.tsx            // Data grid of orders
    ├── SalesOrderForm.tsx             // Order creation wrapper
    ├── SalesOrderItems.tsx            // Readonly/Editable line-items
    ├── SalesOrderStatus.tsx           // Badges (Confirmed, Shipped, etc.)
    ├── SalesOrderInvoices.tsx         // Linked billing documents
    ├── SalesOrderPayments.tsx         // Received payments
    ├── SalesOrderShipment.tsx         // Fulfillment tracking
    └── ... (Filters, Search, Toolbar, Timeline, History)
```

## Workflow Lifecycle
1. **Lead** -> **Customer** (UI-3A, UI-3B)
2. **Customer** -> **Opportunity** (UI-3C)
3. **Opportunity** -> **Quotation** (UI-3D): A proposal is drafted and sent via `preview/page.tsx` PDF.
4. **Quotation (Accepted)** -> **Sales Order** (UI-3D): Confirmed commitment to fulfill.
5. **Sales Order** -> **Invoice / Payment / Shipment** (Future Sprints): Execution of the order.

## Forms & Dynamic Math (`QuotationItems.tsx`)
The `QuotationItems.tsx` and `SalesOrderItems.tsx` components handle local array state for rows.
- Each row dynamically calculates: `(Quantity * Unit Price) - Discount = Row Total`
- The parent wrapper (`QuotationForm.tsx`) calculates: `SUM(Row Totals) - Global Discount + Taxes = Grand Total`.
- The data is then submitted as JSON payload to the frozen `POST /api/crm/quotations` endpoints.

## Professional PDF Rendering
The `QuotationPDF.tsx` component is rendered inside `preview/page.tsx`.
- It relies purely on inline styles and standard HTML tables to ensure predictable output when the browser's "Print to PDF" is invoked.
- A `@media print` CSS block hides all application chrome (navbars, sidebars) leaving only the A4-proportioned layout.

## Responsive Rules
- **Desktop (min-width: 1024px)**: Full Data Tables. Builder forms display side-by-side grids.
- **Mobile (max-width: 767px)**: Tables require horizontal overflow. Grid layout collapses to single column `flex-direction: column`. PDFs scale but are optimized for standard 8.5x11 viewing.
