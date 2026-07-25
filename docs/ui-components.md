# Enterprise Component Library (UI-1B)

This document serves as the single source of truth for the Shohoj Ledger reusable UI components. All components are built using React, TypeScript, and pure Vanilla CSS referencing the UI-0 Design Tokens.

## Principles

1. **Accessibility First**: Components implement proper ARIA roles, states, and keyboard navigation.
2. **Zero External UI Dependencies**: No Tailwind, Bootstrap, Material UI, or Headless UI libraries.
3. **Strict Theming**: All components automatically adapt to Light, Dark, and System themes via CSS variables.
4. **Composition over Configuration**: Components like `Card`, `Tabs`, `Accordion`, and `Table` are designed as compound components (e.g., `<Card>`, `<CardHeader>`, `<CardContent>`) rather than accepting massive prop objects.

## Component Categories

### 1. Primitives
- **Button**: Handles primary, secondary, outline, ghost, danger, success variants. Built-in loading states and icon slots.
- **Badge**: Tiny status indicators.
- **Chip**: Actionable tags (e.g., removable filters).
- **Avatar**: User representation with image, initials, or icon fallbacks.
- **Skeleton**: Shimmering placeholders for loading states.

### 2. Form Elements
- **Input**: Standard text inputs with label, error, and icon support.
- **Textarea**: Multi-line inputs.
- **Select**: Native select wrapper.
- **MultiSelect**: Custom dropdown for array selections.
- **Checkbox, Radio, Switch**: Accessible boolean and choice toggles.

### 3. Feedback & Overlays
- **Modal & Dialog**: Centered overlays utilizing `#modal-root`. `Dialog` provides standardized confirmation layouts.
- **Drawer**: Edge-aligned slide-out panels (left/right) utilizing `#drawer-root`.
- **Toast**: Queue-based notification system (`ToastProvider`, `ToastContainer`, `useToast`) utilizing `#toast-root`.
- **Alert**: Static inline notifications.
- **Loading**: Spinners and page-level loaders.
- **EmptyState & ErrorState**: Standardized placeholders for data-less views.
- **Dropdown, Popover, Tooltip**: Contextual floating elements.

### 4. Layout & Data
- **Card**: Standard containers (default, interactive, dashboard).
- **StatCard**: Dashboard widget for metrics and trends.
- **Tabs**: Horizontal content organization.
- **Accordion**: Vertical collapsible panels.
- **Progress**: Linear progress bars.
- **Pagination**: Standardized page navigation logic.
- **Table**: Low-level HTML table wrappers.
- **DataGrid**: High-level table component with built-in client-side sorting and row selection.

## Usage Example

```tsx
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Card, CardContent } from '@/components/ui/Card/Card';

export function ExampleForm() {
  return (
    <Card>
      <CardContent>
        <Input label="Email Address" type="email" required />
        <Button variant="primary" className="mt-4">Submit</Button>
      </CardContent>
    </Card>
  );
}
```
