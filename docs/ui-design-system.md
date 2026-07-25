# Shohoj Ledger - Enterprise Design System (UI-0)

## 1. Brand Identity & Design Goals
Shohoj Ledger is a modern Enterprise SaaS ERP targeting CEOs, Accountants, HR Managers, Sales Teams, Inventory Managers, and Business Owners.

**Design Principles:**
- **Premium & Professional:** High-quality aesthetics, exuding trust and reliability.
- **Clean & Spacious:** Emphasize whitespace and clear separation of concerns.
- **Fast & Minimal:** Avoid unnecessary visual clutter; ensure fast cognitive processing.
- **Consistent:** Uniformity across all modules and components.
- **Unique Identity:** Avoid cloning generic admin templates.

---

## 2. Design Tokens & Core Variables

### Color Palette

**Primary & Secondary**
- **Primary:** `--primary` (Deep Blue `#2563EB`) - Main actions, active states.
- **Secondary:** `--secondary` (Slate `#475569`) - Secondary actions, borders, muted elements.
- **Accent:** `--accent` (Indigo `#4F46E5`) - Highlights, special features.

**Semantic Colors**
- **Success:** `--success` (Emerald `#10B981`) - Success states, positive trends.
- **Warning:** `--warning` (Amber `#F59E0B`) - Warnings, pending actions.
- **Danger:** `--danger` (Rose `#EF4444`) - Errors, destructive actions.
- **Info:** `--info` (Sky `#0EA5E9`) - Informational messages, hints.

**Grayscale (Neutral)**
- `--gray-50` to `--gray-900` - Used for text, backgrounds, and borders.

### Typography
- **Font Family:** Inter (Sans-serif)
- **Base Size:** 16px (`1rem`)
- **Font Scale:**
  - `xs` (0.75rem / 12px)
  - `sm` (0.875rem / 14px)
  - `base` (1rem / 16px)
  - `lg` (1.125rem / 18px)
  - `xl` (1.25rem / 20px)
  - `2xl` (1.5rem / 24px)
  - `3xl` (1.875rem / 30px)

### Spacing System (8px Grid)
- `--space-1`: 4px (0.25rem)
- `--space-2`: 8px (0.5rem)
- `--space-3`: 12px (0.75rem)
- `--space-4`: 16px (1rem)
- `--space-5`: 20px (1.25rem)
- `--space-6`: 24px (1.5rem)
- `--space-8`: 32px (2rem)
- `--space-10`: 40px (2.5rem)
- `--space-12`: 48px (3rem)
- `--space-16`: 64px (4rem)

### Radius & Border
- `--radius-sm`: 4px
- `--radius-md`: 6px
- `--radius-lg`: 8px
- `--radius-xl`: 12px
- `--radius-2xl`: 16px
- `--radius-full`: 9999px

### Shadows & Elevation
- `--shadow-sm`: Subtle shadow for buttons and inputs.
- `--shadow-md`: Default shadow for cards.
- `--shadow-lg`: Prominent shadow for dropdowns and popovers.
- `--shadow-xl`: Deep shadow for modals and dialogs.

### Animation & Transitions
- `--transition-fast`: 150ms ease-in-out
- `--transition-base`: 200ms ease-in-out
- `--transition-slow`: 300ms ease-in-out

### Z-Index System
- `--z-dropdown`: 1000
- `--z-sticky`: 1020
- `--z-fixed`: 1030
- `--z-modal-backdrop`: 1040
- `--z-modal`: 1050
- `--z-popover`: 1060
- `--z-tooltip`: 1070

---

## 3. Grid & Layout Specifications

**Breakpoints:**
- Mobile: `< 768px`
- Tablet: `768px` - `1023px`
- Laptop: `1024px` - `1439px`
- Desktop: `1440px` - `1599px`
- Large Desktop: `1600px` - `1919px`
- Ultra-wide: `>= 1920px`

**Layout Dimensions:**
- **Sidebar Width:** 280px (Expanded), 80px (Collapsed)
- **Topbar Height:** 64px
- **Content Max-Width:** 1600px
- **Page Padding:** 24px (Desktop), 16px (Mobile)
- **Card Padding:** 20px

**Page Template Structure:**
Every page should adhere to this structure:
1. Header & Breadcrumbs
2. Toolbar (Actions)
3. Filter Area
4. Main Content (Grid / Table)
5. Side Panel (Optional - for details)

---

## 4. Dark Theme Guide
- **Fully Supported:** Handled via `@media (prefers-color-scheme: dark)` and the `.dark` class on the `<html>` element.
- **Shared Tokens:** Use semantic tokens (e.g., `--bg`, `--surface`, `--text-main`) rather than hardcoded colors so styles adapt automatically.
- **Elevations:** In dark mode, shadows are less effective. Use subtle borders (`--border-color`) and lighter background layers (`--surface-light`, `--surface-hover`) to show depth.

---

## 5. Accessibility Guide (A11y)
- **WCAG AA Compliance:** Ensure color contrast ratios meet at least 4.5:1 for standard text.
- **Keyboard Navigation:** All interactive elements must be focusable.
- **Focus Rings:** Use clear focus rings (`:focus-visible`) styled with `--primary-glow`. Avoid `outline: none` without a custom focus state.
- **ARIA Labels:** Use `aria-label` for icon-only buttons, `aria-expanded` for accordions/dropdowns, and role attributes where semantic HTML falls short.

---

## 6. Component Naming Convention & Folder Structure

**Folder Structure:**
```
components/
├── ui/          # Primitive components (Button, Input, Badge, Modal)
├── layout/      # Layout components (Sidebar, Topbar, PageHeader)
└── shared/      # Complex/composed components (DataTable, StatCard)
```

**Naming Convention:**
- Use PascalCase for component files (e.g., `Button.tsx`, `DataTable.tsx`).
- CSS Modules (if used) should be named `ComponentName.module.css`.
- Props interfaces should be named `ComponentNameProps`.

---

## 7. Component Library & Roadmap

### Primitives (`components/ui/`)
- [ ] Button
- [ ] Input & Textarea
- [ ] Select & Combobox
- [ ] Checkbox, Radio, Switch
- [ ] Avatar & Badge & Chip
- [ ] Card
- [ ] Modal & Drawer
- [ ] Popover & Tooltip
- [ ] Toast & Alert & Notification
- [ ] Dropdown
- [ ] Progress & Loading & Skeleton

### Complex (`components/shared/`)
- [ ] DataTable (Sticky Header, Resizable, Sorting, Filtering, Pagination)
- [ ] Stat Card
- [ ] Command Palette
- [ ] Date Picker & Calendar Widget
- [ ] File/Image Upload

### Layout (`components/layout/`)
- [ ] Sidebar (Collapsible, Groups, Badges)
- [ ] Topbar (Breadcrumb, Global Search, Profile)
- [ ] Page Layout (Header, Content, Side Panel)

---

## 8. Performance Guidelines
- **CSS:** Utilize CSS variables instead of duplicating properties. Prefer utility classes globally or CSS modules locally to avoid conflicts.
- **JS:** Avoid heavy third-party libraries for simple UI elements. Use native browser features where possible.
- **Rendering:** Implement Virtualized Tables (`react-window` or similar) for large datasets. Lazy load complex components and heavy charts.
