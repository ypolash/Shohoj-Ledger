# Responsive Layout Rules

Shohoj Ledger is an Enterprise application; therefore, its primary environment is Desktop (Laptop, 1080p, and Ultra-wide monitors). However, responsive degradation is required for tablets and occasional mobile access.

## Breakpoints
- **Mobile (sm):** `< 768px`
- **Tablet (md):** `768px` - `1023px`
- **Laptop (lg):** `1024px` - `1439px`
- **Desktop (xl):** `1440px` - `1919px`
- **Ultra-wide (2xl):** `>= 1920px`

## 1. Sidebar Behavior
- **Desktop & Ultra-wide:** Sidebar is expanded (280px) by default. Can be collapsed to icon-only (80px).
- **Laptop & Tablet:** Sidebar defaults to collapsed (80px). Hovering expands it as an overlay.
- **Mobile:** Sidebar is completely hidden. A hamburger menu in the Topbar opens it as a full-screen or 80vw Drawer.

## 2. Table Behavior
DataTables are the most complex responsive elements.
- **Desktop:** Full column visibility. Horizontal scroll enabled if columns exceed width.
- **Tablet:** Hide low-priority columns (e.g., `Created At`, `Tags`). Ensure primary identifier (Name) and primary metric (Amount) remain visible.
- **Mobile:** Tables transform into a "Card List" view. Each row becomes a vertical card.

## 3. Toolbar & Filters
- **Desktop:** Search input and primary filters align horizontally.
- **Tablet/Mobile:** Search expands to full width. Filters collapse behind a "Filters (3)" button that opens a Bottom Sheet or Drawer.

## 4. Cards & Grid Layouts (e.g., Dashboards)
- **Ultra-wide:** 4 to 6 columns.
- **Desktop/Laptop:** 3 to 4 columns.
- **Tablet:** 2 columns.
- **Mobile:** 1 column (Stacked vertically).

## 5. Dialogs & Modals
- **Desktop:** Centered Modal with backdrop blur.
- **Mobile:** Modals transform into full-screen Bottom Sheets that slide up from the bottom edge, providing a larger touch target for closing.

## 6. Drawers (Side Panels)
- **Desktop:** Slides in from the right (e.g., 400px or 600px wide).
- **Mobile:** Becomes a full-screen overlay (100vw).
