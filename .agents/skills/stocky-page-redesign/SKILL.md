---
name: stocky-page-redesign
description: >-
  Standardized architecture, layout blueprints, widget decomposition, and design token rules
  for building or redesigning platform pages in Stocky. Use whenever creating a new platform
  page, refactoring an existing page layout, building tables, filter panels, toolbars, or drawers,
  or enforcing zero-hardcoded-styles compliance.
---

# Stocky Platform Page Architecture & Redesign Skill

This skill defines the standardized architecture, component hierarchy, spatial geometry, and token invariants for building and redesigning platform pages in Stocky.

---

## 1. PageView Architecture & Hierarchy

Every platform page must strictly adhere to the 3-layer architecture:

```text
app/platform/[feature]/page.tsx (Route Entry)
  └── views/platform/pages/[Feature]PlatformView.tsx (PageView Orchestrator)
        └── PlatformPageLayout.tsx (Shared Shell)
              └── widgets/[Feature]WorkspaceWidget/ (Self-Contained Widgets)
```

### A. Route Entry (`page.tsx`)
Must be a thin server/client entry point that delegates directly to its corresponding `*PlatformView.tsx`:
```tsx
import { InventoryPlatformView } from '@/views/platform/pages/InventoryPlatformView';

export default function InventoryPage() {
  return <InventoryPlatformView {...props} />;
}
```

### B. PageView Orchestrator (`*PlatformView.tsx`)
- Owns page-level data coordination, header copy, and widget slots.
- Strictly uses a **Clean 2-Tier Header** (`Title` + `Subtitle`).
- 🚨 **Anti-Pattern**: Never introduce 3-tier headers with category eyebrows (e.g. no "Internal logistics" or "Action queue" labels above page titles).
- Wraps content in `<PlatformPageLayout>`:
```tsx
export function InventoryPlatformView(props: InventoryPlatformViewProps) {
  return (
    <PlatformPageLayout
      title="Inventory"
      subtitle="Track active batches, expiry status, and stock levels across your locations."
    >
      <InventoryWorkspaceWidget {...props} />
    </PlatformPageLayout>
  );
}
```

### C. Spatial Rhythm & Geometry
- **Max Width**: `max-w-[1600px]` (`var(--stocky-page-max-width)`).
- **Page Gutters**: Responsive padding `px-4 sm:px-6 lg:px-8`.
- **Vertical Spacing**: Tight, cohesive rhythm using `gap-4 sm:gap-5` between title, tabs, and workspace.

---

## 2. The Unified Workspace Card Architecture

### The Problem: Fragmented "Floating Islands"
Old layouts separated the toolbar (search bar pill) and the data table into disconnected floating containers with large empty gaps.

### The Standard: Single Unified Card
Merge the toolbar, filter flyout, and data view into a single cohesive card container:

```tsx
<div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-sm flex flex-col relative z-20 overflow-visible">
  {/* 1. Integrated Toolbar Header */}
  <div ref={filterBarRef} className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
    <FeatureToolbarWidget ... />
    
    {/* Floating Filter Panel */}
    <AnimatePresence>
      {isFilterOpen && (
        <div className="absolute top-[calc(100%+8px)] inset-x-3 sm:inset-x-3.5 z-50">
          <FeatureFilterPanelWidget ... />
        </div>
      )}
    </AnimatePresence>
  </div>

  {/* 2. Integrated Data / Table Body */}
  <div className="w-full">
    <FeatureTableWidget ... />
  </div>
</div>
```

- **Natural Height**: Avoid artificial viewport-stretching heights (`calc(100dvh - 17.5rem)`). Allow the card to naturally frame the table rows with proportional padding and anchor pagination directly below active rows.

---

## 3. Modular Widget Decomposition & Naming Standards

Pages must be decomposed into independent widgets in `apps/web/src/widgets/`.

### Directory & File Naming
- Pattern: `apps/web/src/widgets/<Domain><Name>Widget/<Domain><Name>Widget.tsx`
- Eliminate redundant or legacy prefixes:
  - ❌ `RedesignedStockWorkspaceWidget` $\rightarrow$ ✅ `InventoryWorkspaceWidget`
  - ❌ `StockInventoryTableWidget` $\rightarrow$ ✅ `InventoryTableWidget`
  - ❌ `StockFilterWorkspacePanel` $\rightarrow$ ✅ `InventoryFilterPanelWidget`
  - ❌ `StockProductLotsWidget` $\rightarrow$ ✅ `InventoryProductLotsWidget`
  - ❌ `StockImportModalWidget` $\rightarrow$ ✅ `InventoryImportModalWidget`
- Always export widgets from `apps/web/src/widgets/index.ts`.
- When renaming existing widgets, provide backward-compatibility type and component aliases:
  ```tsx
  export const StockInventoryTableWidget = InventoryTableWidget;
  export type StockInventoryTableWidgetProps = InventoryTableWidgetProps;
  ```

---

## 4. Hovering Filter Panel Pattern

When users filter tabular data, provide a dedicated floating filter panel:

1. **Zero Container Height Extension**:
   - Must be positioned absolutely (`absolute top-[calc(100%+8px)] inset-x-3 sm:inset-x-3.5 z-50`).
   - Must hover cleanly above the workspace with an elevated shadow (`shadow-bevel-float`).
   - Must **never** expand the toolbar container height or push data rows down.
2. **No Blurring Backdrop**:
   - Do not add dark overlays or backdrop-blur behind the panel; allow the underlying table and sidebar to remain visible.
3. **Dismissal**:
   - Register outside-click listeners and <kbd>Escape</kbd> keyboard handlers.
4. **Content-Type-Driven Inputs**:
   - **Categorical Columns** (`Category`, `Supplier`, `Location`): Search-and-select popover with removable tag chips (`SearchSelectTagField`).
   - **Numerical Columns** (`Quantity`, `Price`): Minimal `Min` and `Max` boundary inputs only.
   - **Date Columns** (`Expiry`, `Audit`): Native HTML5 `From` and `To` date pickers only.
   - **Search Scope Toggles**: Checkbox chips toggling which columns the search bar searches.
5. **Real-Time Feedback**:
   - Display matching item count badge: `Showing X of Y items matching`.
   - Footer contains 1-click "Reset all" and a dark neutral "Done" button (`bg-stocky-text-main text-white hover:bg-black`).

---

## 5. Toolbar Architecture & Button Spatial Invariants

To guarantee pixel-perfect visual consistency across all platform pages (Inventory, Transfers, Suppliers, Locations, etc.), all toolbars and buttons must strictly adhere to the following architectural blueprints:

### A. Standard Toolbar DOM Hierarchy (Required CSS Classes)
Every workspace toolbar must use the canonical CSS classes that link directly to `global.css` design tokens:

```tsx
<div className="stocky-stock-table-toolbar relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  {/* 1. Search Input Group */}
  <div className="stocky-stock-table-toolbar__search-group flex items-center gap-2 min-w-0 flex-1 max-w-md">
    <div className="relative min-w-0 flex-1">
      <SearchIcon size="xs" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub" />
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search..."
        className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-9 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
      />
    </div>
  </div>

  {/* 2. Actions & Queue Filters Group */}
  <div className="stocky-stock-table-toolbar__actions flex flex-wrap items-center gap-2 justify-between sm:justify-end">
    {/* Queue tabs or secondary action buttons */}
    <div className="inline-flex items-center gap-1.5" role="tablist">
      {queueTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={queue === tab.id}
          onClick={() => onQueueChange(tab.id)}
          className={`stocky-table-toolbar-button h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center whitespace-nowrap cursor-pointer transition-colors ${
            queue === tab.id
              ? 'stocky-table-toolbar-button--active border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
              : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* Primary Action Button */}
    <button
      type="button"
      onClick={onPrimaryAction}
      className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
    >
      <PlusIcon size="xs" /> {primaryActionLabel}
    </button>
  </div>
</div>
```

### B. Uniform 40px Control Height Invariant (`h-10`)
All controls in the toolbar must have the exact same height and proportional padding:
- **Height**: Strictly `h-10` (40px / `var(--stocky-height-control)` / `2.5rem`).
- **Horizontal Padding**: Strictly `px-4` (16px) or `var(--stocky-space-3)` (12px).
- **Border Radius**: Strictly `rounded-full` (`999px` / `var(--stocky-radius-full)`).
- **Typography**: Strictly `text-xs font-medium` (`.6875rem` / 11–12px, weight 500).
- **Flex Alignment**: `inline-flex items-center justify-center gap-1.5 whitespace-nowrap`.

### C. Primary Action Button Invariant (Signature Lime Accent)
Every platform page's primary call-to-action button (e.g. `+ Add inventory`, `+ Request stock`, `+ Add supplier`):
- **Classes**: `stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer`.
- **Colors**:
  - Background: `var(--stocky-accent)` (`#C6F200`).
  - Text: `var(--stocky-text-main)` (`#191B1F`, dark neutral).
  - Border: `var(--stocky-accent)` (`#C6F200`).
  - Hover: Background `#E3FF47`, border `#E3FF47`, text `#191B1F`.
- 🚨 **Anti-Pattern**: Never style the primary page action button with `bg-stocky-primary` (green `#0E8755`). The primary toolbar CTA is strictly reserved for the signature lime accent.

### D. Queue & Secondary Filter Buttons Invariant
For pages containing queue selectors or status filters (`Needs action`, `Incoming`, `Outgoing`, `All transfers`):
- Each tab MUST be a full-sized toolbar button with `h-10 px-4 rounded-full text-xs font-medium`.
- **Active State**:
  - Must include `stocky-table-toolbar-button--active`.
  - Tailwind: `border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold`.
- **Inactive State**:
  - Tailwind: `border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary`.
- 🚨 **Anti-Pattern**: Never enclose queue filters in miniature sub-pill containers with `h-7` (28px) or `h-8` (32px). This creates visual friction against 40px toolbar controls.

### E. Mobile-First Responsive Toolbar Stacking
- **Desktop ($\ge$ 640px)**: Single horizontal line with search on left and action/queue buttons aligned to right.
- **Mobile (< 640px)**:
  - **Row 1**: Search input with compact secondary actions (`Import`, `Export`).
  - **Row 2**: Up to 3 primary actions (`Audit`, `Resupply`, `+ Add inventory` / `+ Request stock`) with adequate touch targets (> 100px width).
  - Ensures primary actions are never squeezed off-screen.
- **Mobile Cards Cleanup**: Never render duplicate "View details" or "Add inventory" action buttons on each mobile item card if tapping the card itself opens the detail drawer. Keep card layout clean, vertically centered, and high-density.

### F. Critical Anti-Patterns to Prevent
1. ❌ **Missing Container Classes**: Omitting `.stocky-stock-table-toolbar` or `.stocky-stock-table-toolbar__actions` causes buttons to fall back to generic 32px height rules.
2. ❌ **Height Mismatches**: Creating buttons with `h-7` (28px), `h-8` (32px), or `h-9` (36px) in toolbars.
3. ❌ **Color Inconsistencies**: Using green `#0E8755` instead of signature lime `#C6F200` for primary page actions.
4. ❌ **Legacy CSS Clamps**: Writing rules like `.stocky-*-toolbar__queues .stocky-table-toolbar-button { min-height: 1.75rem; }` that artificially shrink buttons.
5. ❌ **Capping Search Bar Width**: Putting `max-w-md` or `max-w-xs` on `.stocky-stock-table-toolbar__search-group`. The search bar MUST extend all the way across the toolbar to meet the action buttons (`flex: 1 min-w-0` without `max-w-*`).

---

## 6. Table Geometry & Single-Line Headers

1. **No Line-Wrapping on Headers**:
   - Always apply `white-space: nowrap;` to `.stocky-board-table__header-cell` and `.stocky-table-header-label`.
   - Never allow `"TOTAL QUANTITY"` or `"NEXT EXPIRY DATE"` to wrap into 2 lines.
2. **Balanced Column Widths**:
   - Primary identifier (`Product`, `Transfer`): `18% - 23%`
   - Secondary routing / info (`Route`, `Supplier`): `20% - 24%`
   - Numeric & metrics (`Quantity`, `Items`): `10% - 14%`
   - Dates & status (`Expiry`, `Status`, `Requested`): `11% - 14%`
   - Actions: `min-w-[48px]`
3. **Header Height**:
   - Explicit `h-11` (44px) row height with `align-middle` vertical alignment.
4. **Column Filter Triggers**:
   - Preserve per-column filter trigger icons next to sort arrows for contextual column filtering.

---

## 7. Side Drawer & Empty State Button Invariants

1. **Empty State Call-to-Action Buttons**:
   - When a table or queue has 0 rows, the call-to-action button must match the primary toolbar button:
     ```tsx
     <button
       type="button"
       onClick={onPrimaryAction}
       className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
     >
       <PlusIcon size="xs" /> {primaryActionLabel}
     </button>
     ```
2. **Side Drawer Footer Action Buttons**:
   - Cancel and submit buttons in side drawers must follow the standard 40px height:
     - Cancel: `h-10 rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer`.
     - Submit / Save: `h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors cursor-pointer shadow-sm`.
   - 🚨 **Anti-Pattern**: Never use `h-8` or `h-9` for drawer footer actions.

---

## 8. Zero Hardcoded Design Code & CSS Token Invariants

All code must strictly comply with the following styling constraints:

- ❌ **Zero Hardcoded Colors**: No raw hex codes (`#191B1F`, `#3B82F6`, `#FFFFFF`) or `rgb()/rgba()` in component JSX.
  - ✅ Use semantic tokens: `bg-stocky-bg-global`, `bg-stocky-bg-widget`, `text-stocky-text-main`, `text-stocky-text-sub`, `border-stocky-border-subtle`, `bg-stocky-primary`.
  - Signature lime accent: `bg-stocky-accent` (`var(--stocky-accent)` / `#C6F200`).
- ❌ **Zero Inline Styles**: No static `style={{ height: '...', borderRadius: '...' }}`.
  - ✅ Use Tailwind classes. (The only exception is dynamic progress bar widths: `style={{ width: `${percent}%` }}`).
- ❌ **Zero Hardcoded SVGs**: Never write `<svg>` tags or import from raw icon packages.
  - ✅ Strictly import from `@stocky/icons`.
- ❌ **No Monospace Fonts**: Never use `font-mono` for barcodes, prices, or numbers.
- ❌ **No Font Weights > 500**: Only `300`, `400`, and `500` are permitted (bold 600 only on active tabs/badges).

---

## 9. Framer Motion Drawer Animation Standard

When implementing side drawers (`SideDrawer.tsx`):
1. **Container as Direct Motion Child**:
   - The drawer container must be a direct child of `<AnimatePresence>` with `initial="closed" animate="open" exit="closed"`.
2. **Spring Physics**:
   ```ts
   const STOCKY_DRAWER_TRANSITION = {
     type: 'spring',
     stiffness: 350,
     damping: 34,
     mass: 0.8,
   };
   ```
3. **Exit State Preservation (Cache Ref)**:
   - When drawers display details for a selected item, store the item in a `useRef` cache (e.g. `lastDetailRowRef`).
   - Use the cached item to render the drawer contents during the exit transition so content does not flash blank or collapse before sliding off-screen.

---

## 10. Comprehensive Verification Checklist for New / Redesigned Pages

Before completing any page redesign or new page implementation, verify every item:

- [ ] **Architecture**: Route uses `*PlatformView.tsx` wrapped in `<PlatformPageLayout>`.
- [ ] **Header**: Clean 2-tier structure (`Title` + `Subtitle`), zero category eyebrows.
- [ ] **Unified Card**: Top controls and data table live in a unified container (`.stocky-stock-unified-card`).
- [ ] **Toolbar Hierarchy**: Outer toolbar has `.stocky-stock-table-toolbar relative`; search group has `.stocky-stock-table-toolbar__search-group`; actions have `.stocky-stock-table-toolbar__actions`.
- [ ] **Uniform Button Heights**: All toolbar buttons, queue selectors, and primary action buttons strictly have `h-10` (40px) and `px-4` (16px).
- [ ] **Primary Action Accent**: Primary action button uses `.stocky-table-toolbar-button--primary` (signature lime `#C6F200` with dark text `#191B1F` and `#E3FF47` hover).
- [ ] **Queue / Secondary Filters**: Queue selectors are full-sized `h-10` buttons with active state `.stocky-table-toolbar-button--active` (border and tint), never 28px miniature pills.
- [ ] **Search Field**: Search input has `h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-9 text-xs`.
- [ ] **Drawer Buttons**: Drawer footer actions strictly have `h-10` height (`px-5` / `px-6`).
- [ ] **Empty State**: Empty state action button matches primary button height `h-10 px-4 rounded-full text-xs font-medium`.
- [ ] **Filter Panel**: Floating flyout with outside-click dismiss, elevated shadow, zero container stretch, and no backdrop-blur.
- [ ] **Table Headers**: Single-line (`white-space: nowrap;`), explicit `h-11` height, zero wrapped header text.
- [ ] **Mobile Toolbar**: Splits into 2 balanced rows without squeezing or cutting off the primary action.
- [ ] **Icons**: 100% imported from `@stocky/icons` (zero `<svg>` tags).
- [ ] **Tokens**: Zero hardcoded hex colors, zero raw rgb(), zero static inline `style={{ ... }}`.
- [ ] **Build Check**: `pnpm --filter web build` passes with 0 TypeScript errors and exit code 0.

