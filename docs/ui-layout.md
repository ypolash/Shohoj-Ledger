# UI Layout Architecture

This document defines the layout architecture and structural components for the Shohoj Ledger Enterprise Application Shell, created in Sprint UI-1A.

## 1. App Shell structure

The root layout is composed of the `<AppShell>` which manages the structural grid of the application. It provides context for global UI states, including the expanded/collapsed state of the Sidebar, the mobile drawer behavior, and the Theme (light/dark/system).

It exposes three global portal roots:
- `#toast-root`
- `#modal-root`
- `#drawer-root`

## 2. Global State (`UIContext`)

The `UIContext` (`lib/contexts/UIContext.tsx`) manages:
- `sidebarOpen` (boolean): Controls the sidebar width on desktop and visibility on mobile.
- `isMobile` (boolean): Automatically updated via a resize listener at `1024px`.
- `theme` (light | dark | system): Persisted to `localStorage` under `shohoj-theme`. Modifies the `html` class directly for Tailwind/Vanilla CSS theme overrides.

## 3. Structural Components (`components/layout/`)

### Sidebar
- Fixed on the left side.
- Expands to `280px` and collapses to `80px`.
- On mobile (`<1024px`), it behaves as an off-canvas drawer (`-100%` translation).
- Uses `lucide-react` icons.
- Auto-collapses on mobile initialization.

### Topbar
- Sticky at the top of the main content wrapper.
- Contains the hamburger menu (mobile) and toggle (desktop).
- Displays Breadcrumbs automatically mapping the `usePathname()` segments.
- Contains the global search trigger (`Ctrl+K`), Theme switcher, Notifications badge, and Profile dropdown.

### PageContainer
- A maximum width container (`max-width: 1600px`).
- Provides uniform padding (`--space-6` on desktop, `--space-4` on mobile).
- All new pages must wrap their content in this container.

### PageHeader
- Standardized page title header.
- Accepts `title`, `description`, and `action` (e.g., "Create New" button).

### Toolbar
- A flexbox wrapper typically placed directly under the `PageHeader` for filters, search inputs, and table controls.
