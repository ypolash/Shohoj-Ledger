# Enterprise Form Standards

Forms are how data enters the ERP. Strict consistency reduces user cognitive load and data entry errors.

## 1. Form Layouts
- **Create Forms:** Rendered in Side Panels (Drawers) sliding from the right to maintain context.
- **Edit Forms:** Rendered in Side Panels, or inline if editing a single field.
- **View Mode:** Detail pages render data as read-only text (not disabled inputs). An "Edit" button switches the view to input mode.
- **Complex Forms (Wizards):** Use multi-step layouts with a left-hand navigation pane for forms exceeding 15 fields (e.g., Employee Onboarding).

## 2. Input Standards
- **Labels:** Always top-aligned above the input.
- **Required Fields:** Marked with a red asterisk `*`.
- **Placeholders:** Provide format examples (e.g., `john@acme.com`), not label repetitions.
- **Helper Text:** Placed below the input for complex requirements (e.g., "Must be 8 characters").

## 3. Validation & Errors
- **Inline Validation:** Occurs `onBlur` (when the user leaves the field). Do not validate while typing unless it's a password strength meter.
- **Error Messages:** Displayed in red text directly below the input, replacing the helper text. The input border turns red.
- **Form-Level Errors:** A Toast notification or Alert banner at the top of the form summarizes submission failures (e.g., "Network Error").

## 4. State Management
- **Draft & Autosave:** Large forms (like Quotations) automatically save to `Draft` state in `localStorage` or backend every 30 seconds.
- **Dirty State:** If a user modifies a form and attempts to close the Drawer without saving, a confirmation dialog triggers: "You have unsaved changes. Discard?"
- **Loading State:** Upon submission, the primary button changes to a spinner and is disabled. The form inputs are disabled to prevent double-submission.
- **Success State:** Form closes, and a Green Toast notification appears in the bottom right.

## 5. Confirmation Modals
- Destructive actions (Delete, Void, Reject) require a specific Confirmation Dialog.
- High-risk actions (e.g., Deleting a Customer) require the user to type the word "DELETE".
