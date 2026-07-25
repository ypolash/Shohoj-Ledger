# Accessibility (A11y) Standards

Shohoj Ledger must be usable by all enterprise users, regardless of ability. This document defines the baseline WCAG AA requirements.

## 1. Keyboard Navigation & Focus Order
- **Rule:** Every interactive element (Links, Buttons, Inputs, Selects) MUST be reachable via the `Tab` key.
- **Focus Order:** Must follow the visual layout (Left-to-Right, Top-to-Bottom). Drawer focuses should be trapped within the drawer until closed.
- **Focus Rings:** `outline: none` is forbidden unless replaced by a custom `:focus-visible` state. The focus ring must have high contrast (e.g., `--primary-glow`).

## 2. ARIA (Accessible Rich Internet Applications)
- **Buttons with Icons Only:** Must have an `aria-label` (e.g., `<button aria-label="Close menu"><Icon /></button>`).
- **Expandable Elements:** Accordions, Dropdowns, and Menus must use `aria-expanded="true/false"`.
- **Modals & Drawers:** Must use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the title of the dialog.
- **Live Regions:** Dynamic notifications (Toasts) must use `role="status"` or `aria-live="polite"`.

## 3. Color Contrast
- **Text Contrast:** Regular text must have a minimum contrast ratio of 4.5:1 against its background. Large text (18pt+) requires 3:1.
- **Non-Text Contrast:** UI components and states (borders, active states) require 3:1 contrast.
- **Meaning:** Never use color alone to convey meaning. A red "Error" badge must also have text saying "Error" or a warning icon.

## 4. Screen Reader Support
- Ensure semantic HTML is used (`<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`).
- Form inputs must have an associated `<label>` using the `htmlFor` attribute.
- Use `aria-hidden="true"` on purely decorative icons to prevent screen reader noise.

## 5. Motion
- Respect the OS-level `prefers-reduced-motion` setting by disabling CSS transitions and animations when active.
