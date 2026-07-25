# Component Usage Guide

To maintain UX consistency across all modules, developers must adhere to this Component Usage Guide when building UI.

## 1. Dialogs vs. Drawers
- **Use a Drawer (Side Panel):** For data entry (Create/Edit forms) and deep-dives (Viewing record details without leaving a list).
- **Use a Dialog (Modal):** For simple, blocking actions (Confirmations, Warnings, simple 1-2 field inputs like "Change Password").
- **Must NOT use:** Do not put complex multi-step forms in a center Modal. Use a full page or a wide Drawer.

## 2. Toasts vs. Alerts
- **Use a Toast:** For ephemeral feedback after an action (e.g., "Customer saved successfully"). Appears in the bottom-right and auto-dismisses.
- **Use an Alert Banner:** For persistent, page-level information (e.g., "Your trial expires in 3 days", "This record is Locked"). Rendered inline at the top of the page.
- **Must NOT use:** Do not use Toasts for critical errors that require user intervention.

## 3. Tooltips vs. Popovers
- **Use a Tooltip:** To explain icon-only buttons or truncated text. Appears on hover. Contains only unformatted text.
- **Use a Popover:** For interactive elements attached to a trigger (e.g., a mini Date Picker, a complex filter menu). Opens on click.
- **Must NOT use:** Do not put buttons or links inside a Tooltip.

## 4. Badges vs. Chips
- **Use a Badge:** For system-defined states and statuses (e.g., `APPROVED`, `PENDING`). Usually read-only.
- **Use a Chip:** For user-defined classifications, tags, or removable filters (e.g., `[VIP x]`). Interactive.

## 5. Command Palette
- **Use:** As a global keyboard shortcut (`Cmd/Ctrl + K`) to search the entire ERP, navigate quickly, or execute global actions ("Create New PO").
- **Must NOT use:** As a replacement for page-level table searching.

## 6. Empty States
- **Use:** When a table or list returns 0 results. Provide a descriptive image, text explaining why it's empty, and a clear Call to Action (e.g., "Add your first Employee").
- **Must NOT use:** Do not just show a blank white screen or a table with 0 rows and no explanation.
