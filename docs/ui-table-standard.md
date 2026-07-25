# Enterprise Table Standards

DataTables are the core UI component of any ERP. Shohoj Ledger implements a strict, unified DataTable standard across all modules.

## 1. Table Toolbar
Located directly above the table.
- **Search Input:** Left-aligned. Debounced global search across primary columns.
- **Filters Button:** Opens a drawer or popover with advanced filters.
- **Density Toggle:** Allows users to switch between Compact, Standard, and Comfortable padding.
- **Column Visibility:** Dropdown to show/hide specific columns.
- **Export/Import:** Standardized CSV/Excel export buttons.

## 2. Bulk Actions
- A master checkbox exists in the table header.
- Selecting rows reveals a contextual "Bulk Actions Toolbar" that overlays the standard toolbar (e.g., "3 items selected [Delete] [Update Status]").

## 3. Structural Features
- **Sticky Header:** The table header must remain pinned to the top of the container during vertical scroll.
- **Column Resize:** Users can drag column separators to resize widths. (State saved to local storage).
- **Pagination:** Bottom right. Controls for Rows per page (10, 25, 50, 100), Current Page, and Next/Prev.

## 4. Sorting & Filtering
- **Sorting:** Clicking a column header sorts ascending/descending. Indicated by a subtle arrow icon.
- **Filtering:** High-value columns (like Status) can have inline filter icons in the header.

## 5. Keyboard Navigation
- Users can use `Up/Down` arrows to traverse rows.
- `Enter` opens the detail view for the focused row.
- `Space` toggles row selection.

## 6. Data Presentation
- **Numbers:** Always right-aligned. Currencies must display symbols and 2 decimal places.
- **Dates:** Use consistent formats (e.g., `DD MMM YYYY`).
- **Statuses:** Always use Badges with semantic colors (Success = Green, Pending = Warning, Rejected = Danger).
- **Avatars/Icons:** Use small 32px avatars for Employees/Customers in the first column to add visual anchor points.
- **Empty State:** If no data exists, display a centered illustration with a clear message and a "Create New" CTA.
